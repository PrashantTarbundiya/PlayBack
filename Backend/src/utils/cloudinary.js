import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (lacalFilePath) =>{
    try{
        if(!lacalFilePath) return null;

        //file upload 
        const response = await cloudinary.uploader.upload(lacalFilePath,{
            resource_type: "auto"
        })
        //uploaded successfully
        // console.log("File is uploaded on cloudinary",response.url)
        fs.unlinkSync(lacalFilePath)
        return response;

    }catch(err){
        fs.unlinkSync(lacalFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        return error;
    }
};


export {uploadOnCloudinary,deleteOnCloudinary}