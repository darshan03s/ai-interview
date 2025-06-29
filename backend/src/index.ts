import dotenv from "dotenv";
dotenv.config({ override: true });
import express, { Request, Response } from "express";
import cors from "cors";
import interviewRoutes from "@routes/interviewRoutes";
import spellCheckRoutes from "@routes/spellCheckRoutes";
import testRoutes from "@routes/testRoutes";
import authenticate from "@middlewares/authenticate";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    console.log("Please ensure it is present in your .env file.");
    process.exit(1);
}

console.log("Current working directory:", process.cwd());
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("SUPABASE_URL exists:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_KEY exists:", !!process.env.SUPABASE_KEY);

// Add these debugging event listeners
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

process.on("exit", (code) => {
    console.log(`Process exiting with code: ${code}`);
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM signal");
});

process.on("SIGINT", () => {
    console.log("Received SIGINT signal");
});

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.use("/interview", authenticate, interviewRoutes);
app.use("/spell-check", authenticate, spellCheckRoutes);
app.use("/test", testRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
