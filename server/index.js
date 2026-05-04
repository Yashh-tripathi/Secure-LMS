import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import {rateLimit} from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config({
    path: ""
});


const app = express();
const PORT = process.env.PORT

//Global rate limiter
const limiter = rateLimit({
    windowMs: 15*60*1000,
    limit: 100,
    message: "Too many messages for this IP, please try later.",
    // standardHeaders: 'draft-8',
    // legacyHeaders: false,
    // ipv6Subnet: 60
});

//security middleware
app.use(helmet());
app.use(ExpressMongoSanitize());
app.use(hpp());
app.use(limiter);

//logger middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}



//body parser middlewares
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(cookieParser());

//Global Error handler
app.use((err, req,res,next) => {
    console.log(err.status)
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
});


//CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD','OPTIONS'],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Access-Control-Allow-Origin",
        "Origin",
        "Accept",
    ]
}))


//API Routes




//always at bottom
//404 handler
app.use((req,res) => {

    res.status(404).json({
        status: "error",
        message: "Route not found !!"
    })

})

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT} in the ${process.env.NODE_ENV}`);
})