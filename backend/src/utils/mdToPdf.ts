import puppeteer from "puppeteer";
import { marked } from "marked";

export const mdToPdf = async (text: string) => {
    const htmlString = marked(text);
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

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(styledHtml);
    const pdf = await page.pdf({
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    await browser.close();
    return pdf;
};
