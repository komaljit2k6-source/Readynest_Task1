import { Response } from 'express';
import { z } from 'zod';
import Form from '../models/Form';
import ResponseModel from '../models/Response';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod Validation Schemas
const FormFieldValidation = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'file']),
  label: z.string().min(1, 'Field label is required'),
  placeholder: z.string().optional().default(''),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional().default([]),
});

const FormSettingsValidation = z.object({
  theme: z.string().optional().default('light'),
  primaryColor: z.string().optional().default('#3b82f6'),
  backgroundColor: z.string().optional().default('#ffffff'),
  buttonText: z.string().optional().default('Submit'),
});

export const FormCreateUpdateSchema = z.object({
  title: z.string().min(1, 'Form title is required'),
  description: z.string().optional().default(''),
  fields: z.array(FormFieldValidation),
  settings: FormSettingsValidation.optional().default(() => ({})),
  isPublished: z.boolean().optional().default(false),
});

// Create Form
export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, fields, settings, isPublished } = req.body;
    const userId = req.user?.userId;

    const newForm = new Form({
      title,
      description,
      userId,
      fields,
      settings,
      isPublished,
    });

    await newForm.save();
    res.status(201).json(newForm);
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ message: 'Server error creating form' });
  }
};

// Get User Forms (for dashboard listing)
export const getUserForms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const forms = await Form.find({ userId }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    console.error('Get user forms error:', error);
    res.status(500).json({ message: 'Server error fetching forms' });
  }
};

// Get Form Details (Private - for builder/dashboard)
export const getFormDetailsPrivate = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized access to this form' });
      return;
    }

    res.json(form);
  } catch (error) {
    console.error('Get form private error:', error);
    res.status(500).json({ message: 'Server error fetching form details' });
  }
};

// Get Form Details (Public - for filling it out)
export const getFormDetailsPublic = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (!form.isPublished) {
      res.status(403).json({ message: 'This form has not been published yet' });
      return;
    }

    // Increment view count asynchronously
    form.viewsCount += 1;
    await form.save();

    // Return only public details (no owner info or analytics counts)
    res.json({
      id: form._id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      settings: form.settings,
    });
  } catch (error) {
    console.error('Get form public error:', error);
    res.status(500).json({ message: 'Server error loading the public form' });
  }
};

// Update Form
export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const { title, description, fields, settings, isPublished } = req.body;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized access to update this form' });
      return;
    }

    form.title = title;
    form.description = description;
    form.fields = fields;
    form.settings = settings;
    form.isPublished = isPublished;

    await form.save();
    res.json(form);
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ message: 'Server error updating form' });
  }
};

// Delete Form
export const deleteForm = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized to delete this form' });
      return;
    }

    await Form.findByIdAndDelete(formId);
    // Delete all responses associated with the form
    await ResponseModel.deleteMany({ formId });

    res.json({ message: 'Form and all its submissions successfully deleted' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ message: 'Server error deleting form' });
  }
};

// Duplicate Form
export const duplicateForm = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized to duplicate this form' });
      return;
    }

    const duplicatedForm = new Form({
      title: `${form.title} (Copy)`,
      description: form.description,
      userId,
      fields: form.fields,
      settings: form.settings,
      isPublished: false,
    });

    await duplicatedForm.save();
    res.status(201).json(duplicatedForm);
  } catch (error) {
    console.error('Duplicate form error:', error);
    res.status(500).json({ message: 'Server error duplicating form' });
  }
};
