import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: {
            url: String,
            public_id: String,
        },
        required: true,
    },
    thumbnail: {
        type: {
            url: String,
            public_id: String,
        },
        required: true
    },
    previewClip: {
        type: {
            url: String,
            public_id: String,
        },
        required: false
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
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
        ],
        default: 'Other'
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate);

export const videoModel = model("Video", videoSchema);
