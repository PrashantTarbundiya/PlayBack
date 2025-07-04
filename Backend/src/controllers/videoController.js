import mongoose, {isValidObjectId} from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"
import { apiErrors } from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {videoModel} from "../models/videoModel.js"
import {userModel} from "../models/userModel.js"
import {likeModel} from "../models/likeModel.js"
import {commentModel} from "../models/commentModel.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pipeline = [];

    if(query){
        pipeline.push({
            $search:{
                index : "search-videos",
                text : {
                    query : query,
                    path : ["title","description"]
                }
            }
        });
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new apiErrors(400,"Invalid UserId");
        }

        pipeline.push({
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({ 
        $match : { 
            isPublished: true
        }
    })
    
    if(sortBy && sortType){
        pipeline.push({
            $sort:{
                [sortBy] : sortType === "asc" ? 1 : -1 
            }
        });
    }else{
        pipeline.push({
            $sort:{
                createdAt: -1
            }
        })
    }

    pipeline.push(
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline : [
                    {
                        $project :{
                            username : 1,
                            "avatar.url" : 1
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$ownerDetails"
        }
    )

    const videoAggregate = videoModel.aggregate(pipeline);

    const options = {
        page : parseInt(page,10),
        limit : parseInt(limit,10)
    }

    const video = await videoModel.aggregatePaginate(videoAggregate, options);
    
    return res.status(200)
    .json(
        new apiResponse(
            200,
            video,
            "Video fetched successfuly"
        )
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if([title,description].some((field) => field?.trim === "")){
        throw new apiErrors(400,"All field are required");
    }

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoLocalPath){
        throw new apiErrors(400,"VideoLocalPath is required");
    }

    if(!thumbnailLocalPath){
        throw new apiErrors(400,"thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile){
        throw new apiErrors(400,"Video not found");
    }

    if(!thumbnailFile){
        throw new apiErrors(400,"Thumbnail not found");
    }

    const video = await videoModel.create({
        title,
        description,
        duration : videoFile.duration,
        videoFile : {
            url : videoFile.url,
            public_id : videoFile.public_id
        },
        thumbnail:{
            url : thumbnailFile.url,
            public_id : thumbnailFile.public_id
        },
        owner : req.user?._id,
        isPublished : false
    })


    const videoUploaded = await videoModel.find(video._id);

    if(!videoUploaded){
        throw new apiErrors(500,"videoUpload failed please try again !!!");
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            video,
            "video uploaded successfully"
        )
    );

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new apiErrors(400, "Invalid userId");
    }

    const video = await videoModel.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(videoId)
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
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owners",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },
                    {
                        $addFields :{
                            subscribersCount : {
                                $size : "$subscribers"
                            },
                            isSubscribed : {
                                $cond : {
                                    if : {
                                        $in : [req.user?._id, "$subscribers.subscriber"]
                                    },
                                    then : true,
                                    else : false
                                }
                            }
                        }
                    },
                    {
                        $project : {
                            username : 1,
                            "avatar.url" : 1,
                            subscribersCount : 1,
                            isSubscribed : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields :{
                likeCount : {
                    $size : "$likes"
                },
                owner : {
                    $first : "$owners"
                },
                isLiked : {
                    $cond : {
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
            $project :{
                "videoFile.url" : 1,
                title : 1,
                description : 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);


    if(!video){
        throw new apiErrors(500,"Failed to fatch video");
    }

    await videoModel.findByIdAndUpdate(
        videoId,
        {
            $inc : {
                views : 1
            }
        }
    )

    await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet : {
                watchHistory: videoId
            }
        }
        
    );


    return res.status(200)
    .json(
        new apiResponse(
            200,
            video[0],
            "video details fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid videoId");
    }

    if(!(title && description)){
        throw new apiErrors(400,"title and description must required");
    }

    const video = await videoModel.findById(videoId)

    if(!video){
        throw new apiErrors(404,"Video not found");
    }

    if(!video.owner || video.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(
            401, "Owner only can edit this video"
        )
    }

    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath){
        throw new apiErrors(400,"thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new apiErrors(400,"thumbnail not found")
    }

    const updateVideo = await videoModel.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title,
                description,
                thumbnail:{
                    public_id : thumbnail.public_id,
                    url : thumbnail.url
                }
            }
        },
        {
            new : true
        }
    )

    if(!updateVideo){
        throw new apiErrors(500,"Fai;ed to update video please try again")
    }

    if(updateVideo){
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            updateVideo,
            "Video update successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid videoId");
    }

    const video = await videoModel.findById(videoId);

    if(!video){
        throw new apiErrors(404,"Video not found");
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(400,"You can't delete this video as you are not owner");
    }

    const videoDelete = await videoModel.findByIdAndDelete(video?._id);

    if(!videoDelete){
        throw new apiErrors(400,"Failed to delete video please try again");
    }

    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id,"video");

    await likeModel.deleteMany({  
        video : videoId
    })

    await commentModel.deleteMany({ 
        video : videoId
    })

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Video delete successfully"
        )
    );
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid videoId");
    }

    const video = await videoModel.findById(videoId);

    if(!video){
        throw new apiErrors(404,"Video not found");
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new apiErrors(400,"You can't delete this video as you are not owner");
    }
    
    const toggledVideoPublish = await videoModel.findByIdAndUpdate(
        videoId,
        {
            $set : {
                isPublished : !video.isPublished
            }
        },
        {
            new : true
        }
    )

    if(!toggledVideoPublish){
        throw new apiErrors(500,"Failed to toogle video publish status");
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {
                isPublished : toggledVideoPublish.isPublished
            },
            "Video publish toggel successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}