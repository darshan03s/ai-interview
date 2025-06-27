import { Router } from "express";
import { spellCheckController } from "@controllers/spellCheckController";

const router = Router();

router.post("/", spellCheckController);

export default router;
