import mongoose, { isValidObjectId } from "mongoose"
import { likeModel } from "../models/likeModel.js"
import { apiErrors } from "../utils/apiErrors.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid videoId");
    }

    const likeAlready = await likeModel.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (likeAlready) {
        await likeModel.findByIdAndDelete(likeAlready?._id)

        return res.status(200)
            .json(
                new apiResponse(
                    200,
                    {
                        isLiked: false
                    }
                )
            )
    }

    await likeModel.create({
        video: videoId,
        likedBy: req.user?._id
    });

    return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    isLiked: true
                }
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new apiErrors(400, "Invalid CommentId");
    }

    const likeAlready = await likeModel.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (likeAlready) {
        await likeModel.findByIdAndDelete(likeAlready?._id)

        return res.status(200)
            .json(
                new apiResponse(
                    200,
                    {
                        isLiked: false
                    }
                )
            )
    }

    await likeModel.create({
        comment: commentId,
        likedBy: req.user?._id
    });

    return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    isLiked: true
                }
            )
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new apiErrors(400, "Invalid tweetId");
    }

    const likeAlready = await likeModel.findOne({
        tweet : tweetId,
        likedBy: req.user?._id
    })

    if (likeAlready) {
        await likeModel.findByIdAndDelete(likeAlready?._id)
        
        // Get updated like count
        const likesCount = await likeModel.countDocuments({ tweet: tweetId })

        return res.status(200)
            .json(
                new apiResponse(
                    200,
                    {
                        tweetId,
                        isLiked: false,
                        likesCount
                    }
                )
            )
    }

    await likeModel.create({
        tweet : tweetId,
        likedBy: req.user?._id
    });
    
    // Get updated like count
    const likesCount = await likeModel.countDocuments({ tweet: tweetId })

    return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    tweetId,
                    isLiked: true,
                    likesCount
                }
            )
        )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const likedVideosAggegate = await likeModel.aggregate([
        {
            $match :{
                likedBy : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup :{
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "likedVideo",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "ownerDetails",
                        }
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                    {
                        $addFields: {
                            owner: "$ownerDetails"
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$likedVideo"
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project :{
                _id : 0,
                likedVideo : {
                    _id : 1,
                    "videoFile.url" : 1,
                    "thumbnail.url" : 1,
                    owner : {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                    title : 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1
                }
            }
        }
    ]);


    return res.status(200)
    .json(
        new apiResponse(
            200,
            likedVideosAggegate,
            "liked videos fetched successfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}