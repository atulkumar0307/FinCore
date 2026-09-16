import express from "express";
import userRouter from "./modules/user/user.routes.js";
export function createApp(){
    const app = express();

    app.use(express.json());

    app.get("/", (req, res) => {
        res.json("Apis are working locally");
    })

    app.use("/api/v1/users", userRouter);

    return app;
}