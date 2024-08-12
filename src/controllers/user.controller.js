import { asyncHandler } from '../utils/asyncHandler.utils.js';
import { ApiError } from '../utils/ApiError.utils.js';
import { ApiResponse } from '../utils/ApiResponse.utils.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.utils.js';

export const registerUser = asyncHandler( async (req, res) => {
    // take data from frontend
    const {fullname, username, email, password} = req.body

    // Validate data => Should not empty
    if(
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(409, "Fill all the required fields.");
    }

    // Check if user already exists.
    const isUserExists = User.findOne({email})
    if(isUserExists){
        throw new ApiError(400, "Email Id already registered.")
    }

    // Check if username already exists.
    const isUsernameExists = User.findOne({username})
    if(isUsernameExists){
        throw new ApiError(400, "Username already exists.")
    }

    // Check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required.");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) throw new ApiError(400, "Avatar is required.");

    // Create user object and create db entry
    const user = await User.create(
        {
            username: username.toLowerCase(),
            email,
            fullname,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        }
    );

    // If user created then remove password and refresh token from the user.
    const createdUser = User.findById(User._id).select("-password -refreshToken");

    // Finally check user is created or not.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong.");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully.", createdUser)
    )

});