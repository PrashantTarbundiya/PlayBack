import mongoose, { isValidObjectId } from "mongoose"
import { playlistModel } from "../models/playlistModel.js"
import { videoModel } from "../models/videoModel.js"
import { apiErrors } from "../utils/apiErrors.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, isPublic, visibility } = req.body

    if (!name || !description) {
        throw new apiErrors(400, "Name and description both required");
    }

    // Special handling for Watch Later playlist - make it private by default
    const isWatchLaterPlaylist = name === 'Watch Later' || name.toLowerCase() === 'watch later'
    const finalIsPublic = isWatchLaterPlaylist ? false : (isPublic !== undefined ? isPublic : true)
    const finalVisibility = isWatchLaterPlaylist ? 'private' : (visibility || 'public')

    const playlist = await playlistModel.create({
        name,
        description,
        owner: req.user?._id,
        isPublic: finalIsPublic,
        visibility: finalVisibility
    });


    if (!playlist) {
        throw new apiErrors(500, "Failed to save playlist");
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                playlist,
                "playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new apiErrors(400, "Invalid userId");
    }

    const playlist = await playlistModel.aggregate([
        {
            $match: {
                $or: [
                    { owner: new mongoose.Types.ObjectId(userId) }, // Owned playlists
                    { savedBy: new mongoose.Types.ObjectId(userId) } // Saved playlists
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $size: "$videos.views"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isSaved: {
                    $cond: {
                        if: { $eq: ["$owner", new mongoose.Types.ObjectId(userId)] },
                        then: false,
                        else: true
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1,
                owner: 1,
                ownerDetails: 1,
                isPublic: { $ifNull: ["$isPublic", true] },
                visibility: { $ifNull: ["$visibility", "public"] },
                isSaved: 1,
                savedBy: 1
            }
        }
    ]);

    return res.status(200)
        .json(
            new apiResponse(
                200,
                playlist,
                "User playlists fetched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid PlaylistId");
    }

    const playlist = await playlistModel.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found");
    }

    const playlistVideos = await playlistModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$ownerDetails"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                isPublic: { $ifNull: ["$isPublic", true] },
                visibility: { $ifNull: ["$visibility", "public"] },
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1,
                    owner: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res.status(200)
        .json(
            new apiResponse(
                200,
                playlistVideos[0],
                "playlist fetched successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid PlaylistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid VideoId")
    }

    const playlist = await playlistModel.findById(playlistId);
    const video = await videoModel.findById(videoId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found");
    }

    if (!video) {
        throw new apiErrors(404, "video not found");
    }

    if (playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new apiErrors(400, "only owner can add video to their playlist")
    }

    // Check if video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        const isWatchLater = playlist.name === 'Watch Later' || playlist.name.toLowerCase() === 'watch later'
        const message = isWatchLater 
            ? "Video is already in Watch Later" 
            : "Video is already in this playlist"
        throw new apiErrors(400, message)
    }

    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {
        throw new apiErrors(500, "failed to add video to playlist please try again")
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Video was added successfully added in playlist"
            )
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid PlaylistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid VideoId")
    }

    const playlist = await playlistModel.findById(playlistId);
    const video = await videoModel.findById(videoId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found");
    }

    if (!video) {
        throw new apiErrors(404, "video not found");
    }

    if (playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new apiErrors(403, "only owner can remove video from their playlist")
    }

    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {
        throw new apiErrors(500, "failed to remove video to playlist please try again")
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Video removed successfully from  playlist"
            )
        )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid playlistId")
    }

    const playlist = await playlistModel.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new apiErrors(403, "only owner can delete the playlist")
    }

    await playlistModel.findByIdAndDelete(playlist?._id);

    return res.status(200)
        .json(
            new apiResponse(
                200,
                {},
                "Playlist deleted successfully"
            )
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description, isPublic, visibility } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid playlistId")
    }

    if (!name || !description) {
        throw new apiErrors(400, "name and description must required");
    }

    const playlist = await playlistModel.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new apiErrors(403, "only owner can update the playlist")
    }

    // Build update object
    const updateFields = {
        name,
        description
    }

    // Add privacy fields if provided
    if (isPublic !== undefined) {
        updateFields.isPublic = isPublic
    }
    if (visibility !== undefined) {
        updateFields.visibility = visibility
    }

    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new apiErrors(500, "Failed to update playlist please try again");
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )

})

const savePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid PlaylistId")
    }

    const originalPlaylist = await playlistModel.findById(playlistId)

    if (!originalPlaylist) {
        throw new apiErrors(404, "Playlist not found")
    }

    // Check if the playlist is public or if user is the owner
    if (!originalPlaylist.isPublic && originalPlaylist.owner.toString() !== req.user?._id.toString()) {
        throw new apiErrors(403, "Cannot save private playlist")
    }

    // Create a new playlist with the same videos for the current user
    // Check if user has already saved this playlist
    if (originalPlaylist.savedBy.includes(req.user._id)) {
        throw new apiErrors(400, "Playlist already saved")
    }

    // Add user to savedBy array
    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                savedBy: req.user._id
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new apiErrors(500, "Failed to save playlist")
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Playlist saved successfully"
            )
        )
})

const getPublicPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query

    const playlists = await playlistModel.aggregate([
        {
            $match: {
                isPublic: true,
                $expr: { $gt: [{ $size: "$videos" }, 0] } // Only playlists with videos
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                updatedAt: 1,
                createdAt: 1,
                isPublic: 1,
                visibility: 1,
                owner: 1
            }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res.status(200)
        .json(
            new apiResponse(
                200,
                playlists,
                "Public playlists fetched successfully"
            )
        )
})

const checkVideoInUserPlaylists = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid VideoId")
    }

    // Get all user's playlists that contain this video
    const playlistsWithVideo = await playlistModel.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                isPublic: 1,
                visibility: 1
            }
        }
    ])

    const isSaved = playlistsWithVideo.length > 0
    
    return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    isSaved,
                    playlists: playlistsWithVideo
                },
                isSaved ? "Video is saved in playlists" : "Video not saved in any playlist"
            )
        )
})

const unsavePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid PlaylistId")
    }

    const playlist = await playlistModel.findById(playlistId)

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found")
    }

    // Check if user has saved this playlist
    if (!playlist.savedBy.includes(req.user._id)) {
        throw new apiErrors(400, "Playlist not saved by user")
    }

    // Remove user from savedBy array
    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                savedBy: req.user._id
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new apiErrors(500, "Failed to unsave playlist")
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Playlist unsaved successfully"
            )
        )
})

const getSavedPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if (!userId) {
        throw new apiErrors(401, "User not authenticated")
    }

    const savedPlaylists = await playlistModel.aggregate([
        {
            $match: {
                savedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isSaved: true
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1,
                createdAt: 1,
                owner: 1,
                ownerDetails: 1,
                isPublic: { $ifNull: ["$isPublic", true] },
                visibility: { $ifNull: ["$visibility", "public"] },
                isSaved: 1
            }
        },
        {
            $sort: { updatedAt: -1 }
        }
    ])

    return res.status(200)
        .json(
            new apiResponse(
                200,
                savedPlaylists,
                "Saved playlists fetched successfully"
            )
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    savePlaylist,
    unsavePlaylist,
    getSavedPlaylists,
    getPublicPlaylists,
    checkVideoInUserPlaylists
}