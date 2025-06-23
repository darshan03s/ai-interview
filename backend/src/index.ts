import dotenv from "dotenv";
dotenv.config({ override: true });
import express, { Request, Response } from "express";
import cors from "cors";
import interviewRoutes from "./routes/interviewRoutes";
import authenticate from "./middlewares/authenticate";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    console.log("Please ensure it is present in your .env file.");
    process.exit(1);
} else {
    console.log("GEMINI_API_KEY is set");
}

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.use("/interview", authenticate, interviewRoutes);

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
