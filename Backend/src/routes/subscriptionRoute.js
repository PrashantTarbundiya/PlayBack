import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscriptionController.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"

const router = Router();
router.use(verifyJWT);

router
    .route("/c/:channelId")
    .post(toggleSubscription);

router.route("/s/:subscriberId").get(getSubscribedChannels);
router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router