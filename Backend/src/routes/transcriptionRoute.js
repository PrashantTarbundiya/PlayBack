import { Router } from "express";
import { getVideoTranscription, regenerateTranscription, updateTranscription } from "../controllers/transcriptionController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

// Get transcription for a video (public)
router.route("/:videoId").get(getVideoTranscription);

// Regenerate transcription (requires auth and ownership)
router.route("/regenerate/:videoId").post(verifyJWT, regenerateTranscription);

// Update transcription manually (requires auth and ownership)
router.route("/:videoId").put(verifyJWT, updateTranscription);

export default router;