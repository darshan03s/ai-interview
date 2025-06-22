import { Router } from "express";
import { createInterviewController } from "../controllers/interviewControllers.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
    res.send("Interview route");
});

router.post("/create-interview", upload.single("file"), createInterviewController);

export default router;
