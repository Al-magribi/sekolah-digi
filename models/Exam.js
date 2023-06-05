import { Schema, model } from "mongoose";

const ExamSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenIn: { type: String, required: false },
    tokenOut: { type: String, required: false },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    durations: { type: String, required: true },
    choice: { type: String, required: true },
    score: { type: String, required: false },
    passing: { type: String, required: true },
    questions: {
      type: [Schema.Types.ObjectId],
      ref: "Question",
      required: false,
    },
    log: { type: [Schema.Types.ObjectId], ref: "User", required: false },
  },
  { timestamps: true }
);

export default model("Exam", ExamSchema);
