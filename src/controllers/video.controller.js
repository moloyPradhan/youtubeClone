import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    const { title, description } = req.body

    const owner = req.user?._id;

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "Video upload failed")
    }

    if (!thumbnail) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    const duration = videoFile?.duration || 60;

    const data = await Video.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        duration,
        owner
    })

    return res
        .status(200)
        .json(new ApiResponse(200, "Video published completed successfully", data))


})

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = '',
        sortBy = 'createdAt',
        sortType = 'desc',
        userId
    } = req.query;

    // Build match stage
    const matchStage = {};

    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    matchStage.isPublished = true

    // Build aggregation pipeline
    const aggregateQuery = Video.aggregate([
        { $match: matchStage },

        // Lookup user
        {
            $lookup: {
                from: 'users', // collection name in lowercase
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        { $unwind: '$owner' },

        {
            $addFields: {
                durationInSecond: "$duration", // rename key
            }
        },

        // Optional: project only selected user fields
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                durationInSecond: 1,
                views: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    _id: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);

    // Sort stage
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortType === 'asc' ? 1 : -1 },
        customLabels: {
            totalDocs: "totalItems",
            docs: "videos",
            limit: "pageSize",
            page: "currentPage",
            totalPages: "pageCount",
            nextPage: "next",
            prevPage: "prev",
            pagingCounter: "pageNumber",
            hasPrevPage: "hasPrevious",
            hasNextPage: "hasNext"
        }
    };

    const result = await Video.aggregatePaginate(aggregateQuery, options);

    return res
        .status(200)
        .json(new ApiResponse(200, "Videos fetched successfully", result));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const data = await Video.findById(videoId).populate('owner', '-password -refreshToken -email -watchHistory');

    return res
        .status(200)
        .json(new ApiResponse(200, "Video file get successfully", data))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { title, description } = req.body
    const owner = req.user?._id;

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== owner.toString()) {
        throw new ApiError(401, "You don't have access to update this video");
    }

    const thumbnailLocalPath = req.file?.path

    if (!thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Thumbnail upload failed")
        }
        video.thumbnail = thumbnail?.url
    }

    video.title = title || video.title
    video.description = description || video.description;

    await video.save()

    return res
        .status(200)
        .json(new ApiResponse(200, "Video updated successfully", video))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== owner.toString()) {
        throw new ApiError(401, "You don't have access to update this video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully", video))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res
        .status(200)
        .json(new ApiResponse(200, "Video publish status toggled successfully", video))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}