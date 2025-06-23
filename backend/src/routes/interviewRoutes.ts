import { Router } from "express";
import {
    createInterviewController,
    prepareInterviewController,
} from "../controllers/interviewControllers";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
    res.send("Interview route");
});

router.post("/create-interview", upload.single("file"), createInterviewController);
router.post("/prepare-interview", prepareInterviewController);

export default router;
