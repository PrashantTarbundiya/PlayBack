import mongoose, { isValidObjectId } from "mongoose"
import { playlistModel } from "../models/playlistModel.js"
import { videoModel } from "../models/videoModel.js"
import { apiErrors } from "../utils/apiErrors.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new apiErrors(400, "Name and description both required");
    }

    const playlist = await playlistModel.create({
        name,
        description,
        owner: req.user?._id
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
                owner: new mongoose.Types.ObjectId(userId)
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
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $size: "$videos.views"
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
                updatedAt: 1
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
                as: "videos"
            }
        },
        {
            $match: {
                "videos.isPublished": true
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
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
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

    if (playlist.owner?.toString() && video.owner.toString() !== req.user?._id.toString()) {
        throw new apiErrors(400, "only owner can add video to thier playlist")
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

    if (playlist.owner?.toString() && video.owner.toString() !== req.user?._id.toString()) {
        throw new apiErrors(403, "only owner can add video to thier playlist")
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
    const { name, description } = req.body

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
        throw new apiErrors(403, "only owner can delete the playlist")
    }

    const updatedPlaylist = await playlistModel.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
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

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}