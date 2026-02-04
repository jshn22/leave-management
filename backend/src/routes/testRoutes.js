import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as testController from '../controllers/testController.js';

const router = express.Router();

router.post('/:sessionId/start',
  authenticate,
  authorize('student'),
  testController.startTest
);

router.put('/:sessionId/mcq/:questionId',
  authenticate,
  authorize('student'),
  testController.submitMCQAnswer
);

router.put('/:sessionId/coding/:questionId',
  authenticate,
  authorize('student'),
  testController.submitCodingAnswer
);

router.post('/:sessionId/submit',
  authenticate,
  authorize('student'),
  testController.submitTest
);

router.get('/:sessionId',
  authenticate,
  testController.getTestSession
);

router.post('/:sessionId/anti-cheat',
  authenticate,
  testController.reportAntiCheat
);

router.post(
  '/ai/create',
  authenticate,
  authorize('student'),
  testController.createAITestSession
);
export default router;
