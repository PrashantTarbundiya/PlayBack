import mongoose, { isValidObjectId } from "mongoose"
import {apiErrors} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { tweetModel } from "../models/tweetModel.js"
import { createTweetNotification } from "./notificationController.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;

    if(!content){
        throw new apiErrors(400,"Content is required")
    }

    const tweet = await tweetModel.create({
        content,
        owner : req.user?._id
    })

    if(!tweet){
        throw new apiErrors(500, "failed to create tweet please try again")
    }

    createTweetNotification(tweet._id, req.user._id);

    return res.status(200)
    .json(
        new apiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;


    if(!isValidObjectId(userId)){
        throw new apiErrors(400,"Invalid user id");
    }

    const tweets = await tweetModel.aggregate([
        {
            $match :{
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails",
                pipeline : [{
                    $project :{
                        username : 1,
                        fullName: 1,
                        avatar : 1,
                    }
                }]
            }
        },
        {
            $lookup:{
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likeDetails",
                pipeline :[{
                    $project :{
                        likedBy : 1,
                    }
                }]
            }
        },
        {
            $addFields:{
                likesCount : {
                    $size: "$likeDetails"
                },
                ownerDetails :{
                    $first : "$ownerDetails"
                },
                isLiked: req.user?._id ? {
                    $in: [new mongoose.Types.ObjectId(req.user._id), "$likeDetails.likedBy"]
                } : false
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project:{
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ]);

    return res.status(200)
    .json(
        new apiResponse(
            200,
            tweets,
            "Tweets fatch successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content }  = req.body;
    const { tweetId } = req.params;

    if(!content){
        throw new apiErrors(400,"Content feild is empty");
    }

    if(!isValidObjectId(tweetId)){
        throw new apiErrors(400,"Invalid tweetId");
    }

    const tweet = await tweetModel.findById(tweetId);

    if(!tweet){
        throw new apiErrors(400,"Twwet not found");
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(403,"Only owner can edit this tweet");
    }

    const newTweet = await tweetModel.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },{
            new : true
        }
    );

    if(!newTweet){
        throw new apiErrors(500,"Failed to edit tweet please try again");
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            newTweet,
            "Tweet edit successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apiErrors(400, "Invalid tweetId");
    }

    const tweet = await tweetModel.findById(tweetId);

    if(!tweet){
        throw new apiErrors(404,"Tweet id not found");
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(403,"Only owner can edit this tweet");
    }

    await tweetModel.findByIdAndDelete(tweet);

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {tweetId},
            "Tweet deleted successfully"
        )
    )
    
})

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const tweets = await tweetModel.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [{
                    $project: {
                        likedBy: 1,
                    }
                }]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isLiked: req.user?._id ? {
                    $in: [new mongoose.Types.ObjectId(req.user._id), "$likeDetails.likedBy"]
                } : false
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: (page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                content: 1,
                owner: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ]);

    return res.status(200)
        .json(
            new apiResponse(
                200,
                tweets,
                "All tweets fetched successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
}