import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { videoModel } from "../models/videoModel.js";
import { generateTranscription } from "../utils/transcription.js";
import { isValidObjectId } from "mongoose";

const getVideoTranscription = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const noGenerate = req.query.noGenerate === 'true';

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid video ID");
    }

    const video = await videoModel.findById(videoId).select("transcription videoFile");

    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    // If transcription exists and is not an error message, return it
    if (video.transcription && !video.transcription.startsWith("Transcription could not be generated")) {
        return res.status(200).json(
            new apiResponse(200, { transcription: video.transcription }, "Transcription retrieved successfully")
        );
    }

    // If noGenerate flag is set, just return null (dashboard use case)
    if (noGenerate) {
        return res.status(200).json(
            new apiResponse(200, { transcription: null }, "No transcription available")
        );
    }

    // Clear stored error messages so we can retry
    if (video.transcription && video.transcription.startsWith("Transcription could not be generated")) {
        await videoModel.findByIdAndUpdate(videoId, { $unset: { transcription: "" } });
    }

    // If no transcription exists, generate it
    if (!process.env.GEMINI_API_KEY) {
        throw new apiErrors(500, "Transcription service not available");
    }

    try {
        const transcription = await generateTranscription(video.videoFile.url);
        
        if (transcription) {
            // Save transcription to database
            await videoModel.findByIdAndUpdate(videoId, { transcription });
            
            return res.status(200).json(
                new apiResponse(200, { transcription }, "Transcription generated and saved successfully")
            );
        } else {
            throw new apiErrors(500, "Failed to generate transcription");
        }
    } catch (error) {
        console.error("Transcription error:", error);
        throw new apiErrors(500, "Failed to generate transcription");
    }
});

// Rate limiter: 5 regenerations per user per day
const DAILY_REGEN_LIMIT = 5;
const regenTracker = new Map(); // userId -> { count, date }

const regenerateTranscription = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id.toString();

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid video ID");
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const userTrack = regenTracker.get(userId);
    if (userTrack && userTrack.date === today) {
        if (userTrack.count >= DAILY_REGEN_LIMIT) {
            throw new apiErrors(429, `Daily limit reached. You can regenerate up to ${DAILY_REGEN_LIMIT} transcripts per day. Try again tomorrow.`);
        }
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    // Check if user owns the video
    if (video.owner.toString() !== userId) {
        throw new apiErrors(403, "You can only regenerate transcription for your own videos");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new apiErrors(500, "Transcription service not available");
    }

    try {
        const transcription = await generateTranscription(video.videoFile.url);
        
        if (transcription) {
            // Update transcription in database
            await videoModel.findByIdAndUpdate(videoId, { transcription });

            // Update rate limit counter
            if (userTrack && userTrack.date === today) {
                userTrack.count += 1;
            } else {
                regenTracker.set(userId, { count: 1, date: today });
            }

            const remaining = DAILY_REGEN_LIMIT - (regenTracker.get(userId)?.count || 0);
            
            return res.status(200).json(
                new apiResponse(200, { transcription, remaining }, "Transcription regenerated successfully")
            );
        } else {
            throw new apiErrors(500, "Failed to regenerate transcription");
        }
    } catch (error) {
        if (error instanceof apiErrors) throw error;
        console.error("Transcription regeneration error:", error);
        throw new apiErrors(500, "Failed to regenerate transcription");
    }
});

const updateTranscription = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { transcription } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid video ID");
    }

    if (transcription === undefined || transcription === null) {
        throw new apiErrors(400, "Transcription text is required");
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apiErrors(403, "You can only edit transcription for your own videos");
    }

    await videoModel.findByIdAndUpdate(videoId, { transcription });

    return res.status(200).json(
        new apiResponse(200, { transcription }, "Transcription updated successfully")
    );
});

export { getVideoTranscription, regenerateTranscription, updateTranscription };