import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userComments"
            }
        },
        {
            $unwind: "$userComments"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                username: "$userComments.username",
                fullName: "$userComments.fullName",
                avatar: "$userComments.avatar"
            }
        },
        {
            $sort: { createdAt: -1 } // latest comments first
        },
    ])

    return res.status(200).json(new ApiResponse(200, "Comments", { comments }))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    return res.status(200).json(new ApiResponse(200, "Comment successful"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { content } = req.body

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    comment.content = content
    await comment.save()

    return res.status(200).json(new ApiResponse(200, "Comment update successful", { content }))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(new ApiResponse(200, "Comment delete successful"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}