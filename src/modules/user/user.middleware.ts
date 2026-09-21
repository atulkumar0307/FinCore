import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AuthUser } from "./user.auth.types.js";

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(token, env.jwt.secret);
        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.userId !== "string"
        ){
            return res.status(401).json({
                message: "Invalid token playload",
            });
        }
        const authUser : AuthUser = {
            userId: decoded.userId,
        };
        req.user = authUser;
        next();
    }catch(error){
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}