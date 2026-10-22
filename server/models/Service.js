import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    prefix: {
      type: String,
      required: [true, 'Please provide a service prefix (e.g., ADM, FEE, EX)'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Prefix must be at least 2 characters'],
      maxlength: [5, 'Prefix cannot exceed 5 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    averageServiceTime: {
      type: Number,
      required: [true, 'Please provide average service time in minutes'],
      default: 5,
      min: [1, 'Average service time must be at least 1 minute'],
      max: [120, 'Average service time cannot exceed 120 minutes'],
    },
    counterLocation: {
      type: String,
      default: 'Main Counter',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model('Service', serviceSchema);
export default Service;
