import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  chatWithNotes,
  generateQuiz,
  suggestRevision,
  getNotes,
  saveChatMessage,
  getChatHistory,
  deleteNote,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer setup for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/upload').post(protect, upload.single('file'), uploadDocument);
router.route('/chat').post(protect, chatWithNotes);
router.route('/chat/save').post(protect, saveChatMessage);
router.route('/chat/history').get(protect, getChatHistory);
router.route('/quiz').post(protect, generateQuiz);
router.route('/revision').get(protect, suggestRevision);
router.route('/notes').get(protect, getNotes);
router.route('/notes/:id').delete(protect, deleteNote);

export default router;
