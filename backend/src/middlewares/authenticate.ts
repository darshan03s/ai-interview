import supabase from "../supabase/supabase";
import { Request, Response, NextFunction } from "express";

export default async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("No token provided");
        res.status(401).json({ message: "Authentication token required." });
        return;
    }

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("JWT verification error:", error);
            res.status(403).json({ message: "User not found." });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in authenticateToken middleware:", error);
        res.status(500).json({
            message: "Internal server error during verification.",
        });
    }
}
