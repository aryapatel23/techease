import express from 'express';
import {
  getClassAnalytics,
  getStudentAnalytics,
  getDashboardStats
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/class/:classId', authenticate, getClassAnalytics);
router.get('/student/:studentId', authenticate, getStudentAnalytics);
router.get('/dashboard', authenticate, getDashboardStats);

export default router;
