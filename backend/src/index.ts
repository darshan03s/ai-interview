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

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.use("/interview", authenticate, interviewRoutes);
app.use("/spell-check", authenticate, spellCheckRoutes);
app.use("/test", testRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});

export default app;
module.exports = app;
