import supabase from "@db/supabase";
import type { NextFunction, Request, Response } from "express";
import type { ApiResponseType } from "@/types";

export default async function authenticate(
    req: Request,
    res: Response<ApiResponseType>,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("No token provided");
        res.status(401).json({
            success: false,
            error: {
                code: "AUTHENTICATION_TOKEN_REQUIRED",
                message: "Authentication token required.",
            },
        });
        return;
    }

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("JWT verification error:", error);
            res.status(403).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found.",
                },
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in authenticateToken middleware:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Internal server error during verification.",
            },
        });
    }
}
