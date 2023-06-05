import { Schema, model } from "mongoose";

const FeeSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
});

export default model("Fee", FeeSchema);
