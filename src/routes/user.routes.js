import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
} from "../controllers/user.controller.js";

import validate from "../middlewares/validate.js";
import {
    registerSchema,
    loginSchema,
    updateAccountDetailsSchema,
} from "../validators/user.validator.js";

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register")
    .post(
        // validate(registerSchema),
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]),
        registerUser
    )

router.route("/login")
    .post(
        validate(loginSchema),
        loginUser
    )

router.route("/refresh-token")
    .post(refreshAccessToken)

// secure routes
router.route("/logout")
    .post(
        verifyJWT,
        logoutUser
    )

router.route("/change-password")
    .post(
        verifyJWT,
        changeCurrentPassword
    )

router.route("/current-user")
    .get(
        verifyJWT,
        getCurrentUser
    )

router.route("/update-account-details")
    .patch(
        verifyJWT,
        validate(updateAccountDetailsSchema),
        updateAccountDetails
    )

router.route("/avatar")
    .patch(
        verifyJWT,
        upload.single("avatar"),
        updateUserAvatar
    )

router.route("/cover-image")
    .patch(
        verifyJWT,
        upload.single("coverImage"),
        updateUserCoverImage
    )

router.route("/channel/:username")
    .get(
        verifyJWT,
        getUserChannelProfile
    )

router.route("/watch-history")
    .get(
        verifyJWT,
        getWatchHistory
    )





export default router