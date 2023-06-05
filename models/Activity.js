import { Schema, model } from "mongoose";

const ActivitySchema = new Schema(
  {
    title: { type: String, required: true },
    img: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Activity", ActivitySchema);
