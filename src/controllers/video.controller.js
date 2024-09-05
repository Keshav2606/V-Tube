import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/Video.model.js";
import {User} from "../models/User.model.js";
import {ApiResponse} from "../utils/ApiResponse.utils.js";
import {ApiError} from "../utils/ApiError.utils.js";
import {asyncHandler} from "../utils/asyncHandler.utils.js";
import {uploadOnCloudinary} from "../utils/cloudinary.utils.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    let skip = (page - 1)*limit;

    const videos = await Video.aggregatePaginate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ])

    if(!videos){
        throw new ApiError(404, "Videos not found.")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Videos fetched successfully.",
        videos
    ))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    console.log("req.body: ", req.body)
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400, "title and description are required.")
    }

    const videoLocalPath = req.files?.video[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400, "Video is required.")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required.")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    console.log("video: ", video)
    if(!video){
        throw new ApiError(500, "Something went wrong while uploading video.")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbnail.")
    }

    const uploadedVideoDetails = await Video.create({
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        owner: req.user?._id,
        title,
        description,
        duration: video?.duration
    });

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Video Published Successfully.",
        uploadedVideoDetails
    ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found.")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Video fetched Successfully.",
        video
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if(!title || !description){
        throw new ApiError(400, "title and description are required to update.")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required to update.")
    }
    const thumbnail = uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbnail.")
    }

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        }
    );

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Video details are updated successfully."
    ))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    await Video.deleteOne({_id: videoId})

    return res.status(200)
    .json(new ApiResponse(
        200,
        "Video deleted Successfully.",
        {}
    ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    const prevPublishedStatus = video.isPublished

    video.isPublished = !prevPublishedStatus
    // Start from here.
       
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}