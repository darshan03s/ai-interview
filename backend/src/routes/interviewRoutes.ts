import { Router } from 'express';
import multer from 'multer';
import {
    createInterviewController,
    startInterviewController,
    continueInterviewController,
    getMessagesController,
    getInterviewsController,
    deleteInterviewController,
    renameInterviewController,
    getReportController,
    endInterviewController,
} from '@controllers/interviewControllers';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create-interview', upload.single('file'), createInterviewController);
router.post('/start-interview', startInterviewController);
router.post('/continue-interview', continueInterviewController);
router.post('/get-messages', getMessagesController);
router.post('/get-interviews', getInterviewsController);
router.post('/delete-interview', deleteInterviewController);
router.post('/rename-interview', renameInterviewController);
router.post('/get-report', getReportController);
router.post('/end-interview', endInterviewController);

export default router;
