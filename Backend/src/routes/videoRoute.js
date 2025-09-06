import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import mongoose from "mongoose";
import { videoModel } from "../models/videoModel.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiErrors } from "../utils/apiErrors.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    publishAVideo,
    togglePublishStatus,
    getUserVideos,
    getAllVideosWithOwnerDetails,
    getVideoCategories,
    getRecommendedVideos,
    getWatchNextVideos
} from "../controllers/videoController.js";

const router = Router();

router
    .route("/")
    .get(getAllVideosWithOwnerDetails)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
    );


router.route("/all").get(getAllVideos);

router.route("/search").get(getAllVideos);

router.route("/categories").get(getVideoCategories);

router.route("/recommendations").get(getRecommendedVideos);

router.route("/watch-next/:videoId").get(getWatchNextVideos);

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/user/:username").get(getUserVideos);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/views/:videoId").patch(async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!mongoose.isValidObjectId(videoId)) {
            throw new apiErrors(400, "Invalid video ID");
        }
        
        await videoModel.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
        
        return res.status(200).json(
            new apiResponse(200, {}, "Views incremented successfully")
        );
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Failed to increment views";
        return res.status(statusCode).json(
            new apiErrors(statusCode, message)
        );
    }
});

export default router;