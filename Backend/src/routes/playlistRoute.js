import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
    savePlaylist,
    unsavePlaylist,
    getSavedPlaylists,
    getPublicPlaylists,
    checkVideoInUserPlaylists,
} from "../controllers/playlistController.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist)
router.route("/public").get(getPublicPlaylists)
router.route("/saved").get(getSavedPlaylists)

// Specific routes must come before parameterized routes
router.route("/check/:videoId").get(checkVideoInUserPlaylists);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/save/:playlistId").post(savePlaylist);
router.route("/unsave/:playlistId").post(unsavePlaylist);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

export default router