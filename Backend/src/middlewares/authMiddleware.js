import { apiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { userModel } from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {  //res -> not used so _ is used to ignore it
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new apiErrors(401, "Unauthorized user");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new apiErrors(401, "Invalid Access Token");
        }
        req.user = user;
        next();
    } 
    catch (error) {
        throw new apiErrors(401, error?.message || "Invalid Access Token");
    }
})