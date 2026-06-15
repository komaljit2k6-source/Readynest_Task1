import { Router } from 'express';
import {
  createForm,
  getUserForms,
  getFormDetailsPrivate,
  getFormDetailsPublic,
  updateForm,
  deleteForm,
  duplicateForm,
  FormCreateUpdateSchema,
} from '../controllers/formController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// Public route to fetch form structure for submission
router.get('/public/:formId', getFormDetailsPublic as any);

// Protected routes
router.use(authMiddleware as any);

router.post('/', validate(FormCreateUpdateSchema), createForm as any);
router.get('/', getUserForms as any);
router.get('/private/:formId', getFormDetailsPrivate as any);
router.put('/:formId', validate(FormCreateUpdateSchema), updateForm as any);
router.delete('/:formId', deleteForm as any);
router.post('/:formId/duplicate', duplicateForm as any);

export default router;
