import express from 'express';
import {
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getDashboardStats,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { superAdminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.put('/users/:userId/toggle', toggleUserStatus);
router.delete('/users/:userId', deleteUser);

export default router;