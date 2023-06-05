import { Schema, model } from "mongoose";

const ClassSchema = new Schema(
  {
    class: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Class", ClassSchema);
