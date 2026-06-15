import { Request, Response } from 'express';
import Form from '../models/Form';
import ResponseModel from '../models/Response';
import { AuthRequest } from '../middleware/authMiddleware';

// Submit response (Public)
export const submitResponse = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body; // Map: fieldId -> value

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (!form.isPublished) {
      res.status(403).json({ message: 'This form is not accepting responses' });
      return;
    }

    // Validate responses against form fields definition
    const validationErrors: { fieldId: string; message: string }[] = [];

    for (const field of form.fields) {
      const value = answers[field.id];

      // Check required
      if (field.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
        validationErrors.push({
          fieldId: field.id,
          message: `${field.label} is required`,
        });
        continue;
      }

      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          validationErrors.push({
            fieldId: field.id,
            message: `${field.label} must be a valid email address`,
          });
        }
      } else if (field.type === 'number') {
        if (isNaN(Number(value))) {
          validationErrors.push({
            fieldId: field.id,
            message: `${field.label} must be a valid number`,
          });
        }
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({ message: 'Validation failed', errors: validationErrors });
      return;
    }

    // Save response
    const newResponse = new ResponseModel({
      formId,
      answers,
    });

    await newResponse.save();

    // Increment submission count
    form.submissionCount += 1;
    await form.save();

    res.status(201).json({ message: 'Response submitted successfully', responseId: newResponse._id });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Server error processing submission' });
  }
};

// Get all responses for a form (Private)
export const getResponses = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized access to responses' });
      return;
    }

    const responses = await ResponseModel.find({ formId }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Server error retrieving responses' });
  }
};

// Get responses analytics (Private)
export const getResponseAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized access to analytics' });
      return;
    }

    const responses = await ResponseModel.find({ formId });

    // Calculate choice frequencies for select, radio, checkbox fields
    const analytics: Record<string, { type: string; label: string; summary: Record<string, number> }> = {};

    form.fields.forEach((field: any) => {
      if (['select', 'radio', 'checkbox'].includes(field.type)) {
        analytics[field.id] = {
          type: field.type,
          label: field.label,
          summary: {},
        };
        // Initialize options
        field.options.forEach((opt: string) => {
          analytics[field.id].summary[opt] = 0;
        });
      }
    });

    responses.forEach((resp) => {
      const answers = resp.answers || {};
      Object.keys(analytics).forEach((fieldId) => {
        const ansVal = answers[fieldId];
        if (ansVal !== undefined && ansVal !== null) {
          if (Array.isArray(ansVal)) {
            // Checkbox multi-select values
            ansVal.forEach((val: string) => {
              if (analytics[fieldId].summary[val] !== undefined) {
                analytics[fieldId].summary[val] += 1;
              } else {
                analytics[fieldId].summary[val] = 1;
              }
            });
          } else {
            // Dropdown or Radio single-select value
            const valStr = String(ansVal);
            if (analytics[fieldId].summary[valStr] !== undefined) {
              analytics[fieldId].summary[valStr] += 1;
            } else {
              analytics[fieldId].summary[valStr] = 1;
            }
          }
        }
      });
    });

    // Submissions over time (last 7 days / monthly grouped)
    // For simplicity, let's group by date
    const dateGrouping: Record<string, number> = {};
    responses.forEach((resp) => {
      const dateStr = new Date(resp.createdAt).toISOString().split('T')[0];
      dateGrouping[dateStr] = (dateGrouping[dateStr] || 0) + 1;
    });

    res.json({
      views: form.viewsCount,
      submissions: form.submissionCount,
      conversionRate: form.viewsCount > 0 ? Math.round((form.submissionCount / form.viewsCount) * 100) : 0,
      fieldAnalytics: analytics,
      submissionTimeline: Object.keys(dateGrouping).map((date) => ({
        date,
        submissions: dateGrouping[date],
      })).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
};

// Export responses to CSV
export const exportResponsesCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.userId.toString() !== userId) {
      res.status(403).json({ message: 'Unauthorized export request' });
      return;
    }

    const responses = await ResponseModel.find({ formId }).sort({ createdAt: -1 });

    // Define CSV Headers
    const headers = ['Submission Date', ...form.fields.map((f: any) => f.label.replace(/"/g, '""'))];
    
    // Construct CSV Rows
    const rows = responses.map((resp) => {
      const rowData = [new Date(resp.createdAt).toLocaleString()];
      
      form.fields.forEach((field: any) => {
        const val = resp.answers[field.id];
        if (val === undefined || val === null) {
          rowData.push('');
        } else if (Array.isArray(val)) {
          rowData.push(`"${val.join(', ').replace(/"/g, '""')}"`);
        } else {
          rowData.push(`"${String(val).replace(/"/g, '""')}"`);
        }
      });
      
      return rowData.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=form_${formId}_submissions.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error exporting responses' });
  }
};
