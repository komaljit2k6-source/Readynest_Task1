import { Router } from 'express';
import {
  submitResponse,
  getResponses,
  getResponseAnalytics,
  exportResponsesCSV,
} from '../controllers/responseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route to submit an answer sheet
router.post('/:formId', submitResponse as any);

// Protected routes to read answers/analytics
router.use(authMiddleware as any);

router.get('/:formId', getResponses as any);
router.get('/:formId/analytics', getResponseAnalytics as any);
router.get('/:formId/export', exportResponsesCSV as any);

export default router;
