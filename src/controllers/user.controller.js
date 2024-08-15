import { asyncHandler } from '../utils/asyncHandler.utils.js';
import { ApiError } from '../utils/ApiError.utils.js';
import { ApiResponse } from '../utils/ApiResponse.utils.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.utils.js';

export const registerUser = asyncHandler( async (req, res) => {
    // take data from frontend
    const {fullname, username, email, password} = req.body
    // console.log(email)

    // Validate data => Should not empty
    if(
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(409, "Fill all the required fields.");
    }

    // Check if user already exists.
    const isUserExists = await User.findOne({
        $or: [{username}, {email}]
    })
    if(isUserExists){
        throw new ApiError(400, "User already exists.")
    }

    // Check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(409, "Avatar is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log(avatar);

    if(!avatar){
        throw new ApiError(404, "Avatar is required.");
    }
    console.log("Avatar uploaded successfully on cloudinary.")
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("coverImage uploaded successfully on cloudinary.")

    // Create user object and create db entry
    const user = await User.create(
        {
            username,
            email,
            fullname,
            password,
            avatar: avatar?.url || "",
            coverImage: coverImage?.url || "",
        }
    );

    // If user created then remove password and refresh token from the user.
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // Finally check user is created or not.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong.");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully.", createdUser)
    )

});