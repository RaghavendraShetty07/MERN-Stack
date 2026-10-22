import express from 'express';
import {
  getServices,
  createService,
  updateService,
  getServiceById,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getServices);
router.get('/:id', protect, getServiceById);
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);

export default router;
