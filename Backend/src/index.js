import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables first
dotenv.config({
    path: join(__dirname, '..', '.env')
});


// Import other modules dynamically after dotenv is loaded
const { default: connectDB } = await import("./db/db.js");
const { app } = await import("./app.js");

connectDB()
    .then(() => {
        app.on("Error", (error) => {
            console.log("Error: ", error);
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server was running at ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("Mongo db connection failed !!!", err);
    })





// import express from "express"
// const app = express()

// ;(async () =>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("errror", (error) => {
//             console.log("ERRR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })

//     }catch(err){
//         console.error("Error :",err);
//     }
// })()