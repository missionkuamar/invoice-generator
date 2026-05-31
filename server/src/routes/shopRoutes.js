import express from 'express';
import {
  getShopProfile,
  updateShopProfile,
  uploadShopLogo,
  deleteShopLogo,
  uploadLogo,
} from '../controllers/shopController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getShopProfile);
router.put('/profile', updateShopProfile);
router.post('/upload-logo', uploadLogo.single('logo'), uploadShopLogo);
router.delete('/delete-logo', deleteShopLogo);

export default router;