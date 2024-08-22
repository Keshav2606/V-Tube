import mongoose, { Schema } from "mongoose";

const communitySchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
        content: {
            type: String,
        },
        images: [
            {
                type: String,
            }
        ]
    }, 
    {
        timestamps: true
    }
);

export const Community = mongoose.model("Community", communitySchema);