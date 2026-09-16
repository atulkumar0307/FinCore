import {Router} from "express";
import { register, login } from "./user.controller.js";
const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);

export default userRouter;