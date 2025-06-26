"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const client = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
exports.default = client;
