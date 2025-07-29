import mongoose, { isValidObjectId } from "mongoose"
import {commentModel} from "../models/commentModel.js"
import {videoModel} from "../models/videoModel.js"
import {apiErrors} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {likeModel} from "../models/likeModel.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid videoId");
    }

    const video = await videoModel.findById(videoId);

    if(!video){
        throw new apiErrors(404,"video not found")
    }

    const commentAggregate = commentModel.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner"
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount : {
                    $size : "$likes"
                },
                owner : {
                    $first : "$owner"
                },
                isLiked : {
                    $cond :{
                        if : {
                            $in : [req.user?._id,"$likes.likedBy"]
                        },
                        then : true,
                        else : false
                    }
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
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ]);

    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10)
    }

    const comments = await commentModel.aggregatePaginate(
        commentAggregate,
        options
    )

    return res.status(200)
    .json(
        new apiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if(!content){
        throw new apiErrors(400,"Content is required")
    }

    const video = await videoModel.findById(videoId);

    if(!video){
        throw new apiErrors(404,"Video not found")
    }

    const comment = await commentModel.create({
        content,
        video : videoId,
        owner : req.user?._id
    })

    if(!comment){
        throw new apiErrors(500,"Failed to add comment please try again")
    }

    // Populate the comment with owner details and like information
    const populatedComment = await commentModel.aggregate([
        {
            $match: {
                _id: comment._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ])

    const commentWithDetails = populatedComment[0] || comment

    return res.status(200)
    .json(
        new apiResponse(
            200,
            commentWithDetails,
            "Comment added successfully"
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if(!content){
        throw new apiErrors(400,"content is required");
    }

    const comment = await commentModel.findById(commentId);

    if(!comment){
        throw new apiErrors(404,"Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(403,"only comment owner can edit their comment")
    }

    const updateComment = await commentModel.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content
            }
        },
        {
            new : true
        }
    )

    if(!updateComment){
        throw new apiErrors(500,"Failed to edit comment please try again")
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            updateComment,
            "Comment edited successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    const comment = await commentModel.findById(commentId);

    if(!comment){
        throw new apiErrors(404,"Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(403,"only comment owner can delete their comment")
    }

    await commentModel.findByIdAndDelete(commentId);

    await likeModel.deleteMany({
        comment : commentId,
        likedBy : req.user
    });

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {commentId},
            "Comment deleted successfully"
        )
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}