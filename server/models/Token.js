import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      required: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    calledAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    servedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on service + dateKey + sequence to guarantee no duplicate numbers per day
tokenSchema.index({ service: 1, dateKey: 1, sequence: 1 }, { unique: true });

// Query indexes for fast status queries
tokenSchema.index({ service: 1, dateKey: 1, status: 1 });
tokenSchema.index({ student: 1, dateKey: 1 });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
