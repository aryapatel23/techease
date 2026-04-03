import express from 'express';
import {
  createTimetableEntry,
  getTimetableByClass,
  getTimetableByTeacher,
  updateTimetableEntry,
  deleteTimetableEntry
} from '../controllers/timetableController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize('teacher', 'admin'), createTimetableEntry);
router.get('/class/:classId', authenticate, getTimetableByClass);
router.get('/teacher/:teacherId?', authenticate, getTimetableByTeacher);
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateTimetableEntry);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteTimetableEntry);

export default router;
