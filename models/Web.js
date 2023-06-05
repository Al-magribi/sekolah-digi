import { Schema, model } from "mongoose";

const WebSchema = new Schema(
  {
    name: { type: String, required: true },
    tagline: { type: String, required: false },
    slider: [
      {
        title: { type: String, required: false },
      },
    ],
    logo: { type: String, required: false },
    hero: { type: String, required: false },
    desc: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: String, required: false },
    info: { type: String, required: false },
  },
  { timestamps: true }
);

export default model("Web", WebSchema);
