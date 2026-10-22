import Service from '../models/Service.js';
import mongoose from 'mongoose';

// @desc    Get services
// @route   GET /api/services
// @access  Signed in
export const getServices = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin && req.query.all === 'true' ? {} : { isActive: true };

    const services = await Service.find(filter).sort({ name: 1 });
    return res.status(200).json({ services });
  } catch (err) {
    console.error('Error fetching services:', err);
    return res.status(500).json({ message: 'Server error fetching services' });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Admin
export const createService = async (req, res) => {
  try {
    const { name, prefix, description, averageServiceTime, counterLocation } = req.body;

    if (!name || !prefix) {
      return res.status(400).json({ message: 'Please provide both service name and prefix' });
    }

    const cleanPrefix = prefix.trim().toUpperCase();

    // Check if prefix already exists
    const existing = await Service.findOne({ prefix: cleanPrefix });
    if (existing) {
      return res.status(400).json({ message: `Prefix '${cleanPrefix}' is already used by ${existing.name}` });
    }

    const service = await Service.create({
      name: name.trim(),
      prefix: cleanPrefix,
      description: description ? description.trim() : '',
      averageServiceTime: Number(averageServiceTime) || 5,
      counterLocation: counterLocation ? counterLocation.trim() : 'Main Counter',
      isActive: true,
    });

    return res.status(201).json({ service });
  } catch (err) {
    console.error('Error creating service:', err);
    return res.status(500).json({ message: 'Server error creating service' });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Admin
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const { name, prefix, description, averageServiceTime, counterLocation, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (name) service.name = name.trim();
    if (prefix) service.prefix = prefix.trim().toUpperCase();
    if (description !== undefined) service.description = description.trim();
    if (averageServiceTime !== undefined) service.averageServiceTime = Number(averageServiceTime);
    if (counterLocation !== undefined) service.counterLocation = counterLocation.trim();
    if (typeof isActive === 'boolean') service.isActive = isActive;

    await service.save();
    return res.status(200).json({ service });
  } catch (err) {
    console.error('Error updating service:', err);
    return res.status(500).json({ message: 'Server error updating service' });
  }
};

// @desc    Get single service detail
// @route   GET /api/services/:id
// @access  Signed in
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    return res.status(200).json({ service });
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching service' });
  }
};
