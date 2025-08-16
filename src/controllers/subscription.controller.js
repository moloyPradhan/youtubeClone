import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user?._id

    // find if record exist
    // if exist remove data
    // if not exist create data

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    })

    if (!existingSub) {
        await Subscription.create({
            channel: channelId,
            subscriber: userId
        })

        return res.status(200).json(new ApiResponse(200, "Channel subscribed successfully", {
            subscribed: true
        }))
    }

    await Subscription.deleteOne({
        channel: channelId,
        subscriber: userId
    })

    return res.status(200).json(new ApiResponse(200, "Channel unsubscribe successfully", {
        subscribed: false
    }))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscribers._id",
                fullName: "$subscribers.fullName",
                username: "$subscribers.username",
                avatar: "$subscribers.avatar",
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, "Subscribers", {
        subscribers
    }))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 0,
                channelId: "$channelDetails._id",
                fullName: "$channelDetails.fullName",
                username: "$channelDetails.username",
                avatar: "$channelDetails.avatar",
                coverImage: "$channelDetails.coverImage",
            }
        }

    ])

    if (!channels?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res.status(200).json(new ApiResponse(200, "Subscription channels", {
        channels
    }))


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}