import { Schema, model } from "mongoose";

const answerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    answer: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        key: { type: String, required: true },
      },
    ],
    correct: { type: String, required: false },
    wrong: { type: String, required: false },
    scorePg: { type: String, required: false },
    scoreEssay: { type: String, required: false, default: 0 },
    finalScore: { type: String, required: false },
  },
  { timestamps: true }
);

export default model("Answer", answerSchema);
