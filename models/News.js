import { Schema, model } from "mongoose";

const NewsSchema = new Schema(
  {
    title: { type: String, required: true },
    img: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("News", NewsSchema);
