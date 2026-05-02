import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config({
    path: ""
});


const app = express();
const PORT = process.env.PORT

//logger middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}



//body parser middlewares
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

//Global Error handler
app.use((err, req,res,next) => {
    console.log(err.status)
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
});


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