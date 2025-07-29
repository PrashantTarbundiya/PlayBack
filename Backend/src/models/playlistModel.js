import mongoose, {Schema ,model} from "mongoose";

const playlistSchema = new Schema({
    name :{
        type : String,
        required : true
    },
    description :{
        type : String
    },
    videos : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
},{timestamps:true});

export const playlistModel = model("Playlist",playlistSchema);