import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    const tweet = await Tweet
        .create({
            content,
            owner: req.user?._id
        })

    return res.status(201).json(new ApiResponse(201, "Tweet post successfully", { tweet }))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    const tweets = await Tweet
        .find({
            owner: userId
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, "Tweets", { tweets }))
})

const updateTweet = asyncHandler(async (req, res) => {

    const { content } = req.body
    const { tweetId } = req.params
    const userId = req.user?._id

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have access to update")
    }

    tweet.content = content
    tweet.edited = true
    await tweet.save()

    return res.status(200).json(new ApiResponse(200, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params
    const userId = req.user?._id

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have access to delete")
    }

    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200).json(new ApiResponse(200, "Tweet deleted successfully", { tweetId }))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}