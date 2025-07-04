import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/commentController.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments)
                        .post(addComment);

router.route("/c/:commentId").delete(deleteComment)
                            .patch(updateComment);

export default router