import { Schema, model } from "mongoose";

const EbookSchema = new Schema(
  {
    title: { type: String, required: true },
    img: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ebook: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Ebook", EbookSchema);
