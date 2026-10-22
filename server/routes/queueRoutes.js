import express from 'express';
import {
  bookToken,
  getMyTokens,
  getServiceQueueStatus,
  callNextToken,
  startService,
  completeService,
  skipToken,
  cancelToken,
  recallToken,
  getAdminAnalytics,
} from '../controllers/queueController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student endpoints
router.post('/book', protect, authorize('student', 'admin'), bookToken);
router.get('/my-tokens', protect, authorize('student', 'admin'), getMyTokens);

// Admin analytics (must be before :serviceId to avoid route clash)
router.get('/admin/analytics', protect, authorize('admin'), getAdminAnalytics);

// Real-time queue snapshot (Authorized: student, staff, admin)
router.get('/:serviceId/status', protect, getServiceQueueStatus);

// Staff and Admin queue control endpoints
router.post('/services/:serviceId/call-next', protect, authorize('staff', 'admin'), callNextToken);
router.post('/:tokenId/start', protect, authorize('staff', 'admin'), startService);
router.post('/:tokenId/complete', protect, authorize('staff', 'admin'), completeService);
router.post('/:tokenId/skip', protect, authorize('staff', 'admin'), skipToken);
router.post('/:tokenId/recall', protect, authorize('staff', 'admin'), recallToken);

// Cancel endpoint (student owner, staff, or admin)
router.post('/:tokenId/cancel', protect, cancelToken);

export default router;
