import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
    constructor(){
        this.retryCount = 0
        this.isConnected = false

        mongoose.set('strictQuery', true);

        mongoose.connection.on('connected', () => {
            console.log(`MongoDB connected successfulyy`);
            this.isConnected = true;
        });
        mongoose.connection.on('error', () => { console.log(`MongoDB connection error`)});
        mongoose.connection.on('disconnected', () => { 
            console.log(`MongoDB disconnected`); 
            this.isConnected = false;
            this.handleDisconnection();
        });


        process.on('SIGTERM', this.handleAppTermination().bind(this));


    }

    async connect(){
        
        try {
            if(!process.env.MONGO_URI){ throw new Error(`MongoDB URI is not defined in the env variables.`) }
            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4 // use karna hai for IPv4 6 for v6
            }
    
            if(process.env.NODE_ENV === 'development'){ mongoose.set('debug', true); }
    
            await mongoose.connect(process.env.MONGO_URI, connectionOptions);
            this.retryCount = 0; // reset retry count on success connect.
        } catch (error) {
            console.log("Initial MongoDB connection failed: ", error.message);
            await this.handleConnectionError();
        }
    }

    async handleConnectionError(){
        if(this.retryCount < MAX_RETRIES){
            this.retryCount++;
            console.log(`Handling reconnection....Attemp ${this.retryCount} of ${MAX_RETRIES}`);
            await new Promise((resolve) => setTimeout(() => {
                resolve
            }, RETRY_INTERVAL));
            return this.connect()
        }else{
            console.error(`Failed to connect to MONGODB after ${MAX_RETRIES} attempts`);
            process.exit(1);
        }
    }

    async handleDisconnection(){
        if(!this.isConnected){
            console.log(`Attempting to reconnect to MongoDB`);
            this.connect()
        }
    }


    async handleAppTermination(){
        try {
            await mongoose.connection.close();
            console.log("MongoDB connection closed through app termination");
            process.exit(0);
        } catch (error) {
            console.error("Error during database disconnection");
            process.exit(1);
        }
    }

    getConnectionStatus(){
        return { 
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        }
    }
}


//singleton instance 
const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);
export const getDbStatus = dbConnection.getConnectionStatus.bind(dbConnection);
