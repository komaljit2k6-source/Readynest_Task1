import mongoose, { Schema } from 'mongoose';

const FormFieldSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'file'],
  },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // for select, radio, checkbox
});

const FormSettingsSchema = new Schema({
  theme: { type: String, default: 'light' },
  primaryColor: { type: String, default: '#3b82f6' }, // Tailwind blue-500
  backgroundColor: { type: String, default: '#ffffff' },
  buttonText: { type: String, default: 'Submit' },
});

const FormSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fields: [FormFieldSchema],
    settings: {
      type: FormSettingsSchema,
      default: () => ({}),
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Form || mongoose.model('Form', FormSchema);
