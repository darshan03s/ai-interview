"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const interviewRoutes_1 = __importDefault(require("./routes/interviewRoutes"));
const spellCheckRoutes_1 = __importDefault(require("./routes/spellCheckRoutes"));
const authenticate_1 = __importDefault(require("./middlewares/authenticate"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    console.log("Please ensure it is present in your .env file.");
    process.exit(1);
}
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.use("/interview", authenticate_1.default, interviewRoutes_1.default);
app.use("/spell-check", authenticate_1.default, spellCheckRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
