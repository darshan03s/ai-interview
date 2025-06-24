import { Router } from "express";
import multer from "multer";
import {
    createInterviewController,
    startInterviewController,
    continueInterviewController,
    getMessagesController,
    getInterviewsController,
    deleteInterviewController,
    renameInterviewController,
} from "../controllers/interviewControllers";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/create-interview", upload.single("file"), createInterviewController);
router.post("/start-interview", startInterviewController);
router.post("/continue-interview", continueInterviewController);
router.post("/get-messages", getMessagesController);
router.post("/get-interviews", getInterviewsController);
router.post("/delete-interview", deleteInterviewController);
router.post("/rename-interview", renameInterviewController);

export default router;
