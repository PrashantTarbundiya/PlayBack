import mongoose, {isValidObjectId} from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"
import { apiErrors } from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {videoModel} from "../models/videoModel.js"
import {userModel} from "../models/userModel.js"
import {likeModel} from "../models/likeModel.js"
import {commentModel} from "../models/commentModel.js"
import { createVideoNotification } from "./notificationController.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, q, sortBy, sortType, userId, category } = req.query
    // Handle both 'query' and 'q' parameters for search compatibility
    const searchQuery = query || q;
    const pipeline = [];

    if(searchQuery){
        // Use regex search instead of Atlas Search for better compatibility
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } }
                ]
            }
        });
    }

    if(category){
        pipeline.push({
            $match: {
                category: category
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
                            fullName : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$ownerDetails"
        },
        {
            $addFields: {
                owner: "$ownerDetails"
            }
        },
        {
            $project: {
                ownerDetails: 0  // Remove the temporary ownerDetails field
            }
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
    const { title, description, category } = req.body

    if([title,description].some((field) => field?.trim() === "")){
        throw new apiErrors(400,"All fields are required");
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
        category: category || 'Other',
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
        isPublished : false,  // Keep default unpublished
        views: 0  // Initialize views to 0
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
                                        $and: [
                                            { $ne: [req.user?._id, null] },
                                            { $in : [req.user?._id, "$subscribers.subscriber"] }
                                        ]
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
                            fullName: 1,
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
                likesCount : {
                    $size : "$likes"
                },
                owner : {
                    $first : "$owners"
                },
                isLiked : {
                    $cond : {
                        if : {
                            $and: [
                                { $ne: [req.user?._id, null] },
                                { $in : [req.user?._id,"$likes.likedBy"] }
                            ]
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
                "thumbnail.url": 1,
                title : 1,
                description : 1,
                category: 1,
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

    if(!video || video.length === 0){
        throw new apiErrors(404,"Video not found");
    }

    await videoModel.findByIdAndUpdate(videoId, { $inc : { views : 1 } })

    if (req.user?._id) {
        await userModel.findByIdAndUpdate(
            req.user._id,
            { $addToSet : { watchHistory: videoId } }
        );
    }

    return res.status(200).json(
        new apiResponse(200, video[0], "video details fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description,category} = req.body

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
                category: category || video.category,
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

    // Create notifications when video is published (not unpublished)
    if (toggledVideoPublish.isPublished && !video.isPublished) {
        // Video was just published, create notifications for subscribers
        createVideoNotification(videoId, req.user._id);
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

const getUserVideos = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!username) {
        throw new apiErrors(400, "Username is required");
    }

    const user = await userModel.findOne({ username }).select("_id");

    if (!user) {
        throw new apiErrors(404, "User not found");
    }

    const pipeline = [
        {
            $match: {
                owner: user._id,
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
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
            $unwind: "$ownerDetails"
        },
        {
            $addFields: {
                owner: "$ownerDetails"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                ownerDetails: 0  // Remove the temporary ownerDetails field
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ];

    const videoAggregate = videoModel.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await videoModel.aggregatePaginate(videoAggregate, options);

    return res.status(200).json(
        new apiResponse(200, videos, "User videos fetched successfully")
    );
});

const getAllVideosWithOwnerDetails = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category } = req.query;
    
    // Build filter object
    const filter = { isPublished: true };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    const videos = await videoModel
        .find(filter)
        .populate('owner', 'username fullName avatar')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
     
    return res.status(200).json(
        new apiResponse(200, videos, "All videos with owner details fetched successfully")
    );
});

const getVideoCategories = asyncHandler(async (req, res) => {
    const categories = [
        'Gaming',
        'Entertainment',
        'Education',
        'Music',
        'Sports',
        'News',
        'Technology',
        'Comedy',
        'Film & Animation',
        'How-to & Style',
        'Travel & Events',
        'Science & Technology',
        'People & Blogs',
        'Pets & Animals',
        'Autos & Vehicles',
        'Non-profits & Activism',
        'Other'
    ];

    // Get video count per category
    const categoryStats = await videoModel.aggregate([
        {
            $match: { isPublished: true }
        },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        }
    ]);

    // Create response with categories and their counts
    const categoriesWithCounts = categories.map(category => {
        const stat = categoryStats.find(s => s._id === category);
        return {
            name: category,
            count: stat ? stat.count : 0
        };
    });

    return res.status(200).json(
        new apiResponse(200, categoriesWithCounts, "Video categories fetched successfully")
    );
});

const getRecommendedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;
    
    let recommendedVideos = [];
    
    if (userId) {
        // Get user's watch history
        const user = await userModel.findById(userId).populate({
            path: 'watchHistory',
            select: 'category owner'
        });
        
        if (user && user.watchHistory && user.watchHistory.length > 0) {
            // Get categories from watch history
            const watchedCategories = user.watchHistory.map(video => video.category);
            const categoryFrequency = {};
            
            // Count frequency of each category
            watchedCategories.forEach(category => {
                categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
            });
            
            // Get most watched categories (top 3)
            const topCategories = Object.entries(categoryFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([category]) => category);
            
            // Get watched video IDs to exclude them
            const watchedVideoIds = user.watchHistory.map(video => video._id);
            
            // Find recommended videos based on top categories
            recommendedVideos = await videoModel.aggregate([
                {
                    $match: {
                        _id: { $nin: watchedVideoIds },
                        category: { $in: topCategories },
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
                    $unwind: "$ownerDetails"
                },
                {
                    $addFields: {
                        owner: "$ownerDetails"
                    }
                },
                {
                    $addFields: {
                        recommendationReason: {
                            $switch: {
                                branches: topCategories.map(category => ({
                                    case: { $eq: ["$category", category] },
                                    then: `Because you watched ${category} videos`
                                })),
                                default: "Recommended for you"
                            }
                        }
                    }
                },
                {
                    $project: {
                        ownerDetails: 0  // Remove the temporary ownerDetails field
                    }
                },
                {
                    $sort: { views: -1, createdAt: -1 }
                },
                {
                    $limit: parseInt(limit) * 2 // Get more to ensure variety
                }
            ]);
        }
    }
    
    // If no recommendations or user not logged in, get trending videos
    if (recommendedVideos.length === 0) {
        recommendedVideos = await videoModel.aggregate([
            {
                $match: { isPublished: true }
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
                $unwind: "$ownerDetails"
            },
            {
                $addFields: {
                    owner: "$ownerDetails"
                }
            },
            {
                $addFields: {
                    recommendationReason: "Trending now"
                }
            },
            {
                $project: {
                    ownerDetails: 0  // Remove the temporary ownerDetails field
                }
            },
            {
                $sort: { views: -1, createdAt: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedVideos = recommendedVideos.slice(startIndex, startIndex + parseInt(limit));
    
    return res.status(200).json(
        new apiResponse(200, {
            videos: paginatedVideos,
            hasMore: recommendedVideos.length > startIndex + parseInt(limit),
            totalCount: recommendedVideos.length
        }, "Recommended videos fetched successfully")
    );
});

const getWatchNextVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { limit = 5 } = req.query;
    const userId = req.user?._id;
    
    if (!isValidObjectId(videoId)) {
        throw new apiErrors(400, "Invalid videoId");
    }
    
    // Get current video details
    const currentVideo = await videoModel.findById(videoId);
    
    if (!currentVideo) {
        throw new apiErrors(404, "Video not found");
    }
    
    let watchNextVideos = [];
    
    // Get videos from same category first
    watchNextVideos = await videoModel.aggregate([
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(videoId) },
                category: currentVideo.category,
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
            $unwind: "$ownerDetails"
        },
        {
            $addFields: {
                owner: "$ownerDetails"
            }
        },
        {
            $addFields: {
                recommendationReason: `More ${currentVideo.category} videos`
            }
        },
        {
            $project: {
                ownerDetails: 0  // Remove the temporary ownerDetails field
            }
        },
        {
            $sort: { views: -1, createdAt: -1 }
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    // If not enough videos from same category, fill with popular videos
    if (watchNextVideos.length < limit) {
        const remaining = limit - watchNextVideos.length;
        const excludeIds = watchNextVideos.map(v => v._id).concat([new mongoose.Types.ObjectId(videoId)]);
        
        const additionalVideos = await videoModel.aggregate([
            {
                $match: {
                    _id: { $nin: excludeIds },
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
                $unwind: "$ownerDetails"
            },
            {
                $addFields: {
                    owner: "$ownerDetails"
                }
            },
            {
                $addFields: {
                    recommendationReason: "You might also like"
                }
            },
            {
                $project: {
                    ownerDetails: 0  // Remove the temporary ownerDetails field
                }
            },
            {
                $sort: { views: -1, createdAt: -1 }
            },
            {
                $limit: remaining
            }
        ]);
        
        watchNextVideos = [...watchNextVideos, ...additionalVideos];
    }
    
    return res.status(200).json(
        new apiResponse(200, watchNextVideos, "Watch next videos fetched successfully")
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getUserVideos,
    getAllVideosWithOwnerDetails,
    getVideoCategories,
    getRecommendedVideos,
    getWatchNextVideos
}