import mongoose, { Schema } from 'mongoose';

const ResponseSchema = new Schema(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Response || mongoose.model('Response', ResponseSchema);
