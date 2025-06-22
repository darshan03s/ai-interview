import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import interviewRoutes from "./routes/interviewRoutes";
import { GoogleGenAI } from "@google/genai";
import authenticate from "./middlewares/authenticate";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export let ai: GoogleGenAI;

try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} catch (error) {
    console.error("Error initializing AI:", error);
}

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.use("/interview", authenticate, interviewRoutes);

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
