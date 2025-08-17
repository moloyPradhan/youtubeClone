import mongoose, { isValidObjectId } from "mongoose"
import { PlayList } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    const playlistExist = await PlayList.find({
        name,
        owner: req.user?._id
    })


    if (playlistExist.length > 0) {
        throw new ApiError(400, "Playlist with this name already exist")
    }

    const playlist = await PlayList.create({
        name,
        description,
        owner: req.user?._id
    })

    return res.status(201).json(new ApiResponse(201, "Playlist created", { playlist }))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const playlists = await PlayList
        .find(
            {
                owner: userId
            },
        )
        .sort({ createdAt: -1 });


    return res.status(200).json(new ApiResponse(200, "Playlists", playlists))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    const playlist = await PlayList.findById(playlistId)
    return res.status(200).json(new ApiResponse(200, "Playlist", playlist))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.user?._id

    const playlist = await PlayList.findOneAndUpdate(
        { _id: playlistId, owner: userId }, // only update if owned by user
        { $addToSet: { videos: videoId } },  // prevent duplicates
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or you do not have access");
    }

    return res.status(201).json(new ApiResponse(201, "Video added to playlist", playlist))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    const userId = req.user?._id; // from auth middleware

    const playlist = await PlayList.findOneAndUpdate(
        { _id: playlistId, owner: userId },   // check ownership
        { $pull: { videos: videoId } },       // remove videoId from array
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or you do not have access");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video removed from playlist", playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    await PlayList.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist deleted"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.user?._id;

    const playlist = await PlayList.findByIdAndUpdate(
        { _id: playlistId, owner: userId },
        {
            ...(name && { name }),
            ...(description && { description })
        },
        { new: true, runValidators: true } // return updated doc, validate schema
    );

    return res.status(200).json(new ApiResponse(200, "Playlist updated", { playlist }))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}