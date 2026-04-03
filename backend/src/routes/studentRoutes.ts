import express from 'express';
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  enrollStudent
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize('teacher', 'admin'), createStudent);
router.get('/', authenticate, getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateStudent);
router.delete('/:id', authenticate, authorize('admin'), deleteStudent);
router.post('/enroll', authenticate, authorize('teacher', 'admin'), enrollStudent);

export default router;
