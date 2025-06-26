"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const spellCheckController_1 = require("../controllers/spellCheckController");
const router = (0, express_1.Router)();
router.post("/", spellCheckController_1.spellCheckController);
exports.default = router;
