import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    getAllTweets,
} from "../controllers/tweetController.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"

const router = Router();

router.route("/").get(getAllTweets).post(verifyJWT, createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router