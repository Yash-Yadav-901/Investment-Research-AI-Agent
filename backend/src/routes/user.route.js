import {signup, get_profile} from "../controllers/user.controller.js";
import {Router} from "express";

const userRouter = Router();

userRouter.route("/signup").post(signup);
userRouter.route("/profile").get(get_profile);

export default userRouter;