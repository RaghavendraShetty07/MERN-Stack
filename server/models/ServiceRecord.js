import mongoose from 'mongoose';

const serviceRecordSchema = new mongoose.Schema(
  {
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceDate: {
      type: Date,
      default: Date.now,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceRecordSchema.index({ service: 1, dateKey: 1 });

const ServiceRecord = mongoose.model('ServiceRecord', serviceRecordSchema);
export default ServiceRecord;
