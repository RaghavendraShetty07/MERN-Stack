import mongoose from 'mongoose';

const queueCounterSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    lastSequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on service + dateKey
queueCounterSchema.index({ service: 1, dateKey: 1 }, { unique: true });

const QueueCounter = mongoose.model('QueueCounter', queueCounterSchema);
export default QueueCounter;
