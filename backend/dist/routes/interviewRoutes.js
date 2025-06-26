"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const interviewControllers_1 = require("../controllers/interviewControllers");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/create-interview", upload.single("file"), interviewControllers_1.createInterviewController);
router.post("/start-interview", interviewControllers_1.startInterviewController);
router.post("/continue-interview", interviewControllers_1.continueInterviewController);
router.post("/get-messages", interviewControllers_1.getMessagesController);
router.post("/get-interviews", interviewControllers_1.getInterviewsController);
router.post("/delete-interview", interviewControllers_1.deleteInterviewController);
router.post("/rename-interview", interviewControllers_1.renameInterviewController);
router.post("/get-report", interviewControllers_1.getReportController);
exports.default = router;
