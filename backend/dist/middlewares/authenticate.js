"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticate;
const supabase_1 = __importDefault(require("../supabase/supabase"));
async function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("No token provided");
        res.status(401).json({ message: "Authentication token required." });
        return;
    }
    try {
        const { data: { user }, error, } = await supabase_1.default.auth.getUser(token);
        if (error || !user) {
            console.error("JWT verification error:", error);
            res.status(403).json({ message: "User not found." });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Error in authenticateToken middleware:", error);
        res.status(500).json({
            message: "Internal server error during verification.",
        });
    }
}
