import mongoose, {Schema ,model} from "mongoose";

const tweetSchema = new Schema({
    content:{
        type : String,
        required : true
    },
    owner :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps:true});

export const tweetModel = model("Tweet",tweetSchema);