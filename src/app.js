import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'


// routes decalration
app.use("/api/users", userRouter)
app.use("/api/videos", videoRouter)



// This should be the LAST middleware in the chain
app.use((err, req, res, next) => {
    console.error('Error middleware:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        data: err.data || null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

export { app }