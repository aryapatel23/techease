import express from 'express';
import {
  addGrade,
  updateGrade,
  getGradesByClass,
  getGradesByStudent,
  getReportCard,
  getExamTypes,
  deleteGrade
} from '../controllers/gradeController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize('teacher', 'admin'), addGrade);
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateGrade);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteGrade);
router.get('/class', authenticate, getGradesByClass);
router.get('/student/:studentId', authenticate, getGradesByStudent);
router.get('/report-card', authenticate, getReportCard);
router.get('/exam-types', authenticate, getExamTypes);

export default router;
