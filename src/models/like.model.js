import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        community: {
            type: Schema.Types.ObjectId,
            ref: "Community"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {
        timestamps: true
    }
);

export const Like = mongoose.model("Like", likeSchema);