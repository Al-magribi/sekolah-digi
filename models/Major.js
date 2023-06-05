import { Schema, model } from "mongoose";

const MajorSchema = new Schema({
  major: { type: String, required: true },
});

export default model("Major", MajorSchema);
