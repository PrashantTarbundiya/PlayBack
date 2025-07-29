import mongoose, {Schema ,model} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary Url
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:function() {
            // Password is required only if no OAuth provider is used
            return !this.googleId && !this.facebookId && !this.githubId;
        },
    },
    refreshToken:{
        type:String
    },
    resetPasswordOTP:{
        type:String
    },
    resetPasswordOTPExpiry:{
        type:Date
    },
    resetPasswordAttempts:{
        type:Number,
        default:0
    },
    resetPasswordLastAttempt:{
        type:Date
    },
    googleId:{
        type:String,
        sparse:true
    },
    facebookId:{
        type:String,
        sparse:true
    },
    githubId:{
        type:String,
        sparse:true
    },
    provider:{
        type:String,
        enum:['local', 'google', 'facebook', 'github'],
        default:'local'
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id : this._id
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const userModel = model("User",userSchema);