import express from 'express';
import { body } from 'express-validator';
import * as leaveController from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

router.get(
  '/my-requests',
  authenticate,
  authorize('student'),
  leaveController.getMyLeaveRequests
);

router.post(
  '/new',
  authenticate,
  authorize('student'),
  sanitizeInput,
  [
    body('leaveType').notEmpty().withMessage('Leave type is required'),
    body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 chars'),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('endDate').isISO8601().withMessage('End date is required')
  ],
  validate,
  leaveController.createLeaveRequest
);

router.get(
  '/:leaveRequestId/current-test',
  authenticate,
  authorize('student'),
  leaveController.getCurrentTestSession
);

router.get(
  '/',
  authenticate,
  authorize('admin'),
  leaveController.getAllLeaveRequests
);

router.put(
  '/:id/review',
  authenticate,
  authorize('admin'),
  leaveController.reviewLeaveRequest
);

router.get(
  '/stats/monthly',
  authenticate,
  authorize('admin'),
  leaveController.getMonthlyLeaveStats
);

router.get(
  '/stats/departments',
  authenticate,
  authorize('admin'),
  leaveController.getDepartmentStats
);

// Common routes
router.get(
  '/:id',
  authenticate,
  leaveController.getLeaveRequestById
);

export default router;
