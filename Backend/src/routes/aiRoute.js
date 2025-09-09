import { Router } from "express";
import { summarizeVideo, askQuestion } from "../controllers/aiController.js";

const router = Router();

router.route("/summarize/:videoId").get(summarizeVideo);
router.route("/ask/:videoId").post(askQuestion);

export default router;