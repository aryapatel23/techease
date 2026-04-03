import express from 'express';
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getSubjects,
  assignSubjectToClass
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize('teacher', 'admin'), createClass);
router.get('/', authenticate, getAllClasses);
router.get('/subjects', authenticate, getSubjects);
router.get('/:id', authenticate, getClassById);
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateClass);
router.delete('/:id', authenticate, authorize('admin'), deleteClass);
router.get('/:id/students', authenticate, getClassStudents);
router.post('/assign-subject', authenticate, authorize('teacher', 'admin'), assignSubjectToClass);

export default router;
