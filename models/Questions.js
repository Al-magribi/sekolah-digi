import { Schema, model } from "mongoose";

const QuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    audio: { type: String, required: false },
    type: {
      type: String,
      enum: ["pg", "essay"],
      required: true,
    },
    options: { type: Object, required: true },
    answer: { type: String, required: false },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  },
  {
    timestamp: true,
  }
);

export default model("Question", QuestionSchema);
