import { Schema, model } from "mongoose";

const SppSchema = new Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
});

export default model("Spp", SppSchema);
