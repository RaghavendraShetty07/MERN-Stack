import mongoose from 'mongoose';
import Token from '../models/Token.js';
import Service from '../models/Service.js';
import QueueCounter from '../models/QueueCounter.js';
import ServiceRecord from '../models/ServiceRecord.js';
import { getCollegeDateKey, formatTokenNumber } from '../utils/dateUtils.js';
import { emitQueueUpdated } from '../utils/socket.js';

/**
 * Helper to compute queue position and estimated wait time for a token
 */
const calculateWaitEstimate = async (service, token) => {
  const dateKey = token.dateKey;
  // Eligible people ahead = tokens for same service & dateKey that are waiting with a lower sequence or currently being called/served
  const waitingAheadCount = await Token.countDocuments({
    service: service._id,
    dateKey,
    status: 'waiting',
    sequence: { $lt: token.sequence },
  });

  const activeServingCount = await Token.countDocuments({
    service: service._id,
    dateKey,
    status: { $in: ['called', 'serving'] },
  });

  const peopleAhead = waitingAheadCount + (token.status === 'waiting' ? activeServingCount : 0);
  const estimatedMinutes = Math.max(0, peopleAhead * (service.averageServiceTime || 5));

  return { peopleAhead, estimatedMinutes };
};

// @desc    Book a digital token
// @route   POST /api/queue/book
// @access  Student
export const bookToken = async (req, res) => {
  try {
    const { serviceId, notes, priority = 0 } = req.body;
    const studentId = req.user._id;

    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: 'Valid service ID is required' });
    }

    // 1. Validate service exists and is active (SRS TC-11)
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (!service.isActive) {
      return res.status(400).json({ message: 'This service is currently closed/deactivated for token booking' });
    }

    // 2. Calculate dateKey in college timezone
    const dateKey = getCollegeDateKey();

    // 3. Check for existing active token for this user and service today (avoid duplicate active tokens)
    const existingActiveToken = await Token.findOne({
      student: studentId,
      service: serviceId,
      dateKey,
      status: { $in: ['waiting', 'called', 'serving'] },
    });

    if (existingActiveToken) {
      return res.status(409).json({
        message: `You already hold an active token (${existingActiveToken.tokenNumber}) for this service today`,
        token: existingActiveToken,
      });
    }

    // 4. Atomically increment the daily sequence counter
    let counter;
    try {
      counter = await QueueCounter.findOneAndUpdate(
        { service: serviceId, dateKey },
        { $inc: { lastSequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (counterErr) {
      // Handle potential race condition on first upsert
      if (counterErr.code === 11000) {
        counter = await QueueCounter.findOneAndUpdate(
          { service: serviceId, dateKey },
          { $inc: { lastSequence: 1 } },
          { new: true }
        );
      } else {
        throw counterErr;
      }
    }

    const nextSequence = counter.lastSequence;
    const tokenNumber = formatTokenNumber(service.prefix, nextSequence);

    // 5. Insert token
    const token = await Token.create({
      tokenNumber,
      sequence: nextSequence,
      service: serviceId,
      student: studentId,
      dateKey,
      status: 'waiting',
      priority: Number(priority) || 0,
      notes: notes ? notes.trim() : '',
    });

    // Populate references for client display
    await token.populate([
      { path: 'service', select: 'name prefix averageServiceTime counterLocation' },
      { path: 'student', select: 'name email' },
    ]);

    // 6. Calculate wait estimate
    const { peopleAhead, estimatedMinutes } = await calculateWaitEstimate(service, token);

    // 7. Broadcast queue update via Socket.IO
    emitQueueUpdated(serviceId, 'booked', {
      tokenNumber: token.tokenNumber,
      status: 'waiting',
    });

    return res.status(201).json({
      message: 'Token booked successfully',
      token,
      peopleAhead,
      estimatedWaitMinutes: estimatedMinutes,
    });
  } catch (err) {
    console.error('Error booking token:', err);
    return res.status(500).json({ message: 'Server error booking token' });
  }
};

// @desc    Get logged in student's tokens
// @route   GET /api/queue/my-tokens
// @access  Student
export const getMyTokens = async (req, res) => {
  try {
    const studentId = req.user._id;
    const dateKey = getCollegeDateKey();

    const tokens = await Token.find({ student: studentId })
      .populate('service', 'name prefix averageServiceTime counterLocation isActive')
      .populate('servedBy', 'name')
      .sort({ createdAt: -1 });

    // Compute wait estimate dynamically for waiting/called tokens today
    const enrichedTokens = await Promise.all(
      tokens.map(async (tok) => {
        const tokenObj = tok.toObject();
        if ((tokenObj.status === 'waiting' || tokenObj.status === 'called') && tokenObj.dateKey === dateKey && tok.service) {
          const { peopleAhead, estimatedMinutes } = await calculateWaitEstimate(tok.service, tok);
          tokenObj.peopleAhead = peopleAhead;
          tokenObj.estimatedWaitMinutes = estimatedMinutes;
        } else {
          tokenObj.peopleAhead = 0;
          tokenObj.estimatedWaitMinutes = 0;
        }
        return tokenObj;
      })
    );

    return res.status(200).json({ tokens: enrichedTokens });
  } catch (err) {
    console.error('Error fetching student tokens:', err);
    return res.status(500).json({ message: 'Server error fetching your tokens' });
  }
};

// @desc    Get real-time queue snapshot for a service
// @route   GET /api/queue/:serviceId/status
// @access  Authorized (Student, Staff, Admin)
export const getServiceQueueStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const dateKey = getCollegeDateKey();

    // Fetch tokens for this service today
    // 1. Serving
    const currentlyServing = await Token.findOne({
      service: serviceId,
      dateKey,
      status: 'serving',
    })
      .populate('student', 'name')
      .populate('servedBy', 'name');

    // 2. Called (ready to serve)
    const currentlyCalled = await Token.find({
      service: serviceId,
      dateKey,
      status: 'called',
    })
      .populate('student', 'name')
      .populate('servedBy', 'name')
      .sort({ calledAt: 1 });

    // 3. Waiting tokens
    const waitingList = await Token.find({
      service: serviceId,
      dateKey,
      status: 'waiting',
    })
      .populate('student', 'name')
      .sort({ priority: -1, sequence: 1 });

    // 4. Completed count today
    const completedTodayCount = await Token.countDocuments({
      service: serviceId,
      dateKey,
      status: 'completed',
    });

    const skippedTodayCount = await Token.countDocuments({
      service: serviceId,
      dateKey,
      status: 'skipped',
    });

    const waitingCount = waitingList.length;
    const estimatedNextWait = (waitingCount + (currentlyServing ? 1 : 0)) * service.averageServiceTime;

    return res.status(200).json({
      service,
      dateKey,
      currentlyServing,
      currentlyCalled,
      waitingList,
      waitingCount,
      completedTodayCount,
      skippedTodayCount,
      estimatedNextWaitMinutes: estimatedNextWait,
    });
  } catch (err) {
    console.error('Error getting queue status:', err);
    return res.status(500).json({ message: 'Server error retrieving queue status' });
  }
};

// @desc    Staff calls the next eligible token in queue
// @route   POST /api/queue/services/:serviceId/call-next
// @access  Staff / Admin
export const callNextToken = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const dateKey = getCollegeDateKey();

    // Check if staff is already serving a token (conditional check: finish current or warn)
    // Find the next waiting token ordered by priority (desc) then sequence (asc)
    const nextToken = await Token.findOne({
      service: serviceId,
      dateKey,
      status: 'waiting',
    })
      .sort({ priority: -1, sequence: 1 })
      .populate('student', 'name email');

    if (!nextToken) {
      return res.status(404).json({ message: 'No waiting tokens in the queue for this service today' });
    }

    // Atomic update status to 'called'
    nextToken.status = 'called';
    nextToken.calledAt = new Date();
    nextToken.servedBy = req.user._id;
    await nextToken.save();

    // Socket notification
    emitQueueUpdated(serviceId, 'called', {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      counterLocation: service.counterLocation,
      serviceName: service.name,
    });

    return res.status(200).json({
      message: `Called token ${nextToken.tokenNumber}`,
      token: nextToken,
    });
  } catch (err) {
    console.error('Error calling next token:', err);
    return res.status(500).json({ message: 'Server error calling next token' });
  }
};

// @desc    Staff starts serving a called token
// @route   POST /api/queue/:tokenId/start
// @access  Assigned Staff / Admin
export const startService = async (req, res) => {
  try {
    const { tokenId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const token = await Token.findById(tokenId).populate('service');
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Lifecycle check: Allowed next status for 'called' is 'serving' (SRS 9.2)
    if (token.status !== 'called') {
      return res.status(409).json({
        message: `Token cannot be started because it is currently '${token.status}' (must be 'called')`,
      });
    }

    token.status = 'serving';
    token.startedAt = new Date();
    token.servedBy = req.user._id;
    await token.save();

    emitQueueUpdated(token.service._id, 'serving', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
    });

    return res.status(200).json({
      message: `Started serving token ${token.tokenNumber}`,
      token,
    });
  } catch (err) {
    console.error('Error starting service:', err);
    return res.status(500).json({ message: 'Server error starting service' });
  }
};

// @desc    Staff completes service for a serving token & records duration
// @route   POST /api/queue/:tokenId/complete
// @access  Assigned Staff / Admin
export const completeService = async (req, res) => {
  try {
    const { tokenId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Lifecycle check: Allowed next status for 'serving' is 'completed' (SRS 9.2 & TC-07)
    if (token.status !== 'serving') {
      return res.status(409).json({
        message: `Token cannot be completed because current status is '${token.status}' (must be 'serving')`,
      });
    }

    const completedAt = new Date();
    token.status = 'completed';
    token.completedAt = completedAt;
    await token.save();

    // Calculate actual service duration in seconds
    const startTime = token.startedAt ? new Date(token.startedAt).getTime() : (token.calledAt ? new Date(token.calledAt).getTime() : completedAt.getTime());
    const durationSeconds = Math.max(1, Math.round((completedAt.getTime() - startTime) / 1000));

    // Record in ServiceRecord for admin analytics and reporting
    const serviceRecord = await ServiceRecord.create({
      token: token._id,
      service: token.service,
      staff: req.user._id,
      durationSeconds,
      serviceDate: completedAt,
      dateKey: token.dateKey,
    });

    emitQueueUpdated(token.service, 'completed', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      durationSeconds,
    });

    return res.status(200).json({
      message: `Completed token ${token.tokenNumber}`,
      token,
      durationSeconds,
      serviceRecord,
    });
  } catch (err) {
    console.error('Error completing service:', err);
    return res.status(500).json({ message: 'Server error completing service' });
  }
};

// @desc    Staff skips a token (student absent/unresponsive)
// @route   POST /api/queue/:tokenId/skip
// @access  Assigned Staff / Admin
export const skipToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Allowed from waiting or called
    if (!['waiting', 'called'].includes(token.status)) {
      return res.status(409).json({
        message: `Cannot skip token with status '${token.status}'`,
      });
    }

    token.status = 'skipped';
    await token.save();

    emitQueueUpdated(token.service, 'skipped', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
    });

    return res.status(200).json({
      message: `Skipped token ${token.tokenNumber}`,
      token,
    });
  } catch (err) {
    console.error('Error skipping token:', err);
    return res.status(500).json({ message: 'Server error skipping token' });
  }
};

// @desc    Cancel a token (by student owner or staff/admin)
// @route   POST /api/queue/:tokenId/cancel
// @access  Owner / Staff / Admin
export const cancelToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Security & resource ownership check (SRS TC-10):
    // If user is student, they must own this token!
    if (req.user.role === 'student' && String(token.student) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You do not own this token' });
    }

    // Can only cancel waiting or called tokens
    if (!['waiting', 'called'].includes(token.status)) {
      return res.status(409).json({
        message: `Cannot cancel token that is already '${token.status}'`,
      });
    }

    token.status = 'cancelled';
    token.cancellationReason = reason || 'Cancelled by user';
    await token.save();

    emitQueueUpdated(token.service, 'cancelled', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
    });

    return res.status(200).json({
      message: `Cancelled token ${token.tokenNumber}`,
      token,
    });
  } catch (err) {
    console.error('Error cancelling token:', err);
    return res.status(500).json({ message: 'Server error cancelling token' });
  }
};

// @desc    Recall token back to called or waiting
// @route   POST /api/queue/:tokenId/recall
// @access  Staff / Admin
export const recallToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const token = await Token.findById(tokenId).populate('service');
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Can recall skipped or called token
    if (!['skipped', 'called'].includes(token.status)) {
      return res.status(409).json({
        message: `Only skipped or called tokens can be recalled. Current status: '${token.status}'`,
      });
    }

    token.status = 'called';
    token.calledAt = new Date();
    token.servedBy = req.user._id;
    await token.save();

    emitQueueUpdated(token.service._id, 'called', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      counterLocation: token.service.counterLocation,
      serviceName: token.service.name,
      recalled: true,
    });

    return res.status(200).json({
      message: `Recalled token ${token.tokenNumber}`,
      token,
    });
  } catch (err) {
    console.error('Error recalling token:', err);
    return res.status(500).json({ message: 'Server error recalling token' });
  }
};

// @desc    Admin Analytics & Queue Metrics
// @route   GET /api/queue/admin/analytics
// @access  Admin
export const getAdminAnalytics = async (req, res) => {
  try {
    const today = getCollegeDateKey();

    const [
      totalToday,
      waitingToday,
      servingToday,
      completedToday,
      skippedToday,
      cancelledToday,
      services,
      serviceRecords,
      recentTokens,
    ] = await Promise.all([
      Token.countDocuments({ dateKey: today }),
      Token.countDocuments({ dateKey: today, status: 'waiting' }),
      Token.countDocuments({ dateKey: today, status: 'serving' }),
      Token.countDocuments({ dateKey: today, status: 'completed' }),
      Token.countDocuments({ dateKey: today, status: 'skipped' }),
      Token.countDocuments({ dateKey: today, status: 'cancelled' }),
      Service.find(),
      ServiceRecord.find({ dateKey: today }).populate('service', 'name prefix'),
      Token.find({ dateKey: today })
        .populate('service', 'name prefix')
        .populate('student', 'name email')
        .populate('servedBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    // Service-by-service breakdown
    const serviceBreakdowns = await Promise.all(
      services.map(async (svc) => {
        const total = await Token.countDocuments({ service: svc._id, dateKey: today });
        const completed = await Token.countDocuments({ service: svc._id, dateKey: today, status: 'completed' });
        const waiting = await Token.countDocuments({ service: svc._id, dateKey: today, status: 'waiting' });
        
        // Compute average duration from service records
        const svcRecords = serviceRecords.filter(r => String(r.service?._id || r.service) === String(svc._id));
        const avgSeconds = svcRecords.length
          ? Math.round(svcRecords.reduce((acc, r) => acc + r.durationSeconds, 0) / svcRecords.length)
          : (svc.averageServiceTime * 60);

        return {
          serviceId: svc._id,
          name: svc.name,
          prefix: svc.prefix,
          isActive: svc.isActive,
          total,
          completed,
          waiting,
          avgDurationMinutes: (avgSeconds / 60).toFixed(1),
        };
      })
    );

    return res.status(200).json({
      dateKey: today,
      overview: {
        totalToday,
        waitingToday,
        servingToday,
        completedToday,
        skippedToday,
        cancelledToday,
      },
      serviceStats: serviceBreakdowns,
      recentTokens,
    });
  } catch (err) {
    console.error('Error generating admin analytics:', err);
    return res.status(500).json({ message: 'Server error compiling analytics' });
  }
};
