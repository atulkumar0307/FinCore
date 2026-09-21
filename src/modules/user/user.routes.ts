import {Router} from "express";
import { register, login, getMe } from "./user.controller.js";
import { authenticate } from "./user.middleware.js";
import { registerSchema, loginSchema } from "./user.validation.js";
import { validateBody } from "./user.validation.middleware.js";

const userRouter = Router();

userRouter.post("/register", validateBody(registerSchema), register);
userRouter.post("/login", validateBody(loginSchema), login);

userRouter.get("/protected", authenticate, (req, res)=>{
    res.json({
        message: "You have access to this protected route",
        userId: req.user?.userId,
    });
})
userRouter.get("/me", authenticate, getMe);

export default userRouter;