import { Request, Response } from "express";
import { registerUser, loginUser, getCurrentUser } from "./user.service.js";
import { refreshAccessToken, revokeRefreshTokenByValue } from "./refresh-token.service.js";
import { RefreshTokenReuseError } from "../../shared/errors/auth.errors.js";

export async function register(req: Request, res: Response){
    const {name, email, password} = req.body;
    const user = await registerUser(name, email, password);

    res.status(201).json(user);
}
export async function login(req: Request, res: Response){
    const {email, password} = req.body;
    const user = await loginUser(email, password);

    if(!user){
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }
    return res.status(200).json(user);
}
export async function getMe(req: Request, res: Response){
    if(!req.user){
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    const user = await getCurrentUser(req.user.userId);

    if(!user){ 
        return res.status(404).json({
            message: "User not found",
        })
    }
    return res.status(200).json(user);
}
export async function refresh(req: Request, res: Response){
    const { refreshToken } = req.body;

    if(
        typeof refreshToken !== "string" ||
        refreshToken.length === 0
    ){
        return res.status(400).json({
            message: "Refresh token is required",
        });
    }
    try{
        const result = await refreshAccessToken(refreshToken);

        if(!result){
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }
        return res.status(200).json(result); 
    } catch (error){
        if(error instanceof RefreshTokenReuseError){
            return res.status(401).json({
                message: "Refresh token reuse detected",
            });
        }
        throw error;
    }
}
export async function logout(
    req: Request,
    res: Response
){
    const { refreshToken } = req.body;

    if(
        typeof refreshToken !== "string" ||
        refreshToken.length === 0
    ){
        return res.status(400).json({
            message: "Refresh token is required",
        });
    }
    await revokeRefreshTokenByValue(refreshToken);

    return res.status(204).send();
}