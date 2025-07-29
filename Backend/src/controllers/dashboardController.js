import mongoose from "mongoose"
import {videoModel} from "../models/videoModel.js"
import {subscriptionModel} from "../models/subscriptionModel.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const totalSubscribers = await subscriptionModel.aggregate([
        {
            $match :{
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group : {
                _id : null,
                subscribersCount: {
                    $sum: 1
                }   
            }
        }
    ]);

    const video = await videoModel.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes"
            }
        },
        {
            $project : {
                totalLikes : {
                    $size : "$likes"
                },
                totalViews : "$views",
                totalVideos : 1
            }
        },
        {
            $group :{
                _id : null,
                totalLikes : {
                    $sum : "$totalLikes"
                },
                totalVideos:{
                    $sum : 1,
                },
                totalViews : {
                    $sum : "$totalViews"
                }
            }
        }
    ]);


    const channelInfo = {
        totalSubscribers : totalSubscribers[0]?.subscribersCount || 0,
        totalLikes : video[0]?.totalLikes || 0,
        totalVideos : video[0]?.totalVideos || 0,
         totalViews: video[0]?.totalViews || 0
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            channelInfo,
            "channel stats fetched successfully"
        )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const videos = await videoModel.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup :{
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $project : {
                _id : 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                isPublished: 1,
                likesCount: 1
            }
        }
    ]);


    return res.status(200)
    .json(
        new apiResponse(
            200,
            videos,
            "channel video fetched successfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
}