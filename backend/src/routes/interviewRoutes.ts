import { Router } from "express";
import {
    createInterviewController,
    startInterviewController,
    continueInterviewController,
    getMessagesController,
} from "../controllers/interviewControllers";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
    res.send("Interview route");
});

router.post("/create-interview", upload.single("file"), createInterviewController);
router.post("/start-interview", startInterviewController);
router.post("/continue-interview", continueInterviewController);
router.post("/get-messages", getMessagesController);

export default router;
