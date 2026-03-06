import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxLenght: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique:true,
        lowercase :true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLenght: [6, "Password must be atleast 6 of characters."],
        select: false,
    },
    role: {
        type: String,
        enum: {
            values: ['student', 'instructor', 'admin'],
            message: 'Please select a valid role'
        },
        default: 'student'
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    bio: {
        type: String,
        maxLenght: [200, "Bio cannot exceed 200 characters."]
    },
    enrolledCourses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        }
    }],
    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
        type: Date,
        default: Date.now,
    },

}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});


/* Hashing the user password */
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12)
    next();
});


/* Comparing the password */
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

/* Handling the reset password token */
userSchema.methods.getResetPasswordToken = async function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
                                .createHash('sha256')
                                .update(resetToken)
                                .digest('hex')
    this.resetPasswordExpire = Date.now() + 10*60*1000 //10 minutes
    return resetToken;
}

userSchema.methods.updateLastActive = function(){
    this.lastActive = Date.now();
    return this.save({ validateBeforeSave: false})
}

/* Virtuals feild for total enrolled courses.*/
userSchema.virtual('totalEnrolledCourses').get(function(){
    return this.enrolledCourses.length
});



export const User = mongoose.model("User", userSchema);