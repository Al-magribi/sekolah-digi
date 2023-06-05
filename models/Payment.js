import { Schema, model } from "mongoose";

const PaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    spp: [
      {
        month: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    fee: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    app: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    url: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Payment", PaymentSchema);
