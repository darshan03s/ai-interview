"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spellCheckController = void 0;
const spellCheck_1 = require("../llm/spellCheck");
const spellCheckController = async (req, res) => {
    const { text } = req.body;
    const result = await (0, spellCheck_1.spellCheck)(text);
    res.json({
        text: result,
    });
};
exports.spellCheckController = spellCheckController;
