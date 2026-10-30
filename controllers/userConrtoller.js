const AppError = require("../utils/AppError");
const User = require("../models/User");

//admin gets all users
const getAllusers = async(erq,res,next)=>{
    try{
        const users = await User.find().select("-password");
        res.status(200).json({
            success: true,
            results:users.length,
            data: {users},


        });
    }catch(error){
        next(error);
    }
};
// admin: activate or deactivate a user
const updateUserStatus = async(req,res,next)=>{
    try{
        const { isActive} = req.body;

        if(typeof isActive !== "boolean"){
            throw new AppError ("isActive must be true or false",400);
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {isActive},
            {new: true, runValidators: true}

        ).select("-password");

        if(!user){
            throw new AppError("User not found",404);
        }
        res.status(200).json({
            success: true,
            message: `User ${isActive ? "activated" : "deactivated"} successfully `,
            data: {user},
        });
    }catch(error){
        next(error);
    }
};
//authentiction happens at auth.js
const getprofile = async (req,res,next)=>{
    try{
        res.status(200).json({
            success: true,
            data:{
                user:{
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role,
                    isActive: req.user.isActive,
                },
            },
        });
    }catch(error){
        next(error)
    }
};

module.exports = {getprofile,getAllusers,updateUserStatus};