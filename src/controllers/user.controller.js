import { asyncHandler } from '../utils/asyncHandler.utils.js';
import { ApiError } from '../utils/ApiError.utils.js';
import { ApiResponse } from '../utils/ApiResponse.utils.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.utils.js';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler( async (req, res) => {
    // take data from frontend
    const {fullname, username, email, password} = req.body;

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
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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

const generateAccessAndRefreshToken = async function(userId){
    try {
        const user =  await User.findById(userId);
        console.log(user);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
        
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong. While generating Access and Refresh Token.")
    }
}


const loginUser = asyncHandler(async (req, res) => {
    // get login credentials from frontend.
    const {username, email, password} = req.body;
    console.log("req body: ", req.body)

    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required.")
    }

    // Check if user exists or not from username or email.
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exists.")
    }

    // If user exists check if the password entered is correct or not.
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    // If password is wrong then throw the error => user doesn't exists.
    if(!isPasswordCorrect){
        throw new ApiError(400, "Password entered is incorect.");
    }

    // Generate AccessToken and RefreshToken.
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    // If password is correct login the user.
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User loggedIn Successfully."
        )
    );
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            } 
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200, 
            "User logged out successfully.", 
            {}
        )
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400, "Unauthorized request.")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id);

    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(400, "Invalid Access Token.")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            "Access Token Refreshed Succcessfully",
            {
                accessToken,
                refreshToken: newRefreshToken
            }
        )
    )

})


export {registerUser, loginUser, logoutUser, refreshAccessToken}