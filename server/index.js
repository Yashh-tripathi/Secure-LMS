import dotenv from  "dotenv";
import express  from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;


// global rate limiting
const limiter = rateLimit({
    windowMs: 15*60*1000, // 15 Minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    message: "Too many requests from this IP, please try late."
});

//security middleware
app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());
app.use('/api', limiter);


//logging middleware 
if(process.env.NODE_ENV === "development"){
    app.use(morgan('dev'));
}

//body parser middleware 
app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({extended: true, limit: "10kb"}));
app.use(cookieParser());


//global error handler
app.use((err, req,res,next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || "Internal server error.",
        ...(process.env.NODE_ENV === "development" && {stack: err.stack})
    });
});

//CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Allow-Control-Allow-Origin",
        "Origin",
        "Accept",
    ],
}));

//api routes


//404 handler
// it should always be at the bottom.
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Route not found"
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on the port ${PORT} in ${process.env.NODE_ENV} mode`)
});
