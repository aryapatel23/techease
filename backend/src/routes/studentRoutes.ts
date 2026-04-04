import express from 'express';
import {
  createStudent,
  bulkCreateStudents,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  enrollStudent
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize('teacher', 'admin'), createStudent);
router.post('/bulk', authenticate, authorize('teacher', 'admin'), bulkCreateStudents);
router.get('/', authenticate, getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateStudent);
router.delete('/:id', authenticate, authorize('admin'), deleteStudent);
router.post('/enroll', authenticate, authorize('teacher', 'admin'), enrollStudent);

export default router;
