const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name:{
            type: String,
            equired: [true, "Category name is required"],
            trim: true,
            maxlength: 100,

        },
        slug:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description:{
            type:String,
            trim: true,
            maxlength: 500,

        },
        parent:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,

        },
        isActive:{
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

categorySchema.index({ parent: 1});
module.exports = mongoose.model("Category",categorySchema);

