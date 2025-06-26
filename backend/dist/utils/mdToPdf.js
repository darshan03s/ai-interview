"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mdToPdf = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const marked_1 = require("marked");
const mdToPdf = async (text) => {
    const htmlString = (0, marked_1.marked)(text);
    const styledHtml = `
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.4; }
        h1 { margin-top: 0px; margin-bottom: 0px; }
        h2 { margin-top: 0px; margin-bottom: 0px; }
        h3 { margin-top: 0px; margin-bottom: 0px; }
        ul { margin-bottom: 10px; }
        ol { margin-bottom: 10px; }
        li { margin-bottom: 5px; }
        p { margin-bottom: 10px; font-size: 14px; }
      </style>
      ${htmlString}
    `;
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    await page.setContent(styledHtml);
    const pdf = await page.pdf({
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    await browser.close();
    return pdf;
};
exports.mdToPdf = mdToPdf;
