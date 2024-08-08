import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB Connected !! \nDB Host: ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("MONGODB CONNECTION ERROR: ", error);
        throw error;
    }
    
};

export default connectDB;