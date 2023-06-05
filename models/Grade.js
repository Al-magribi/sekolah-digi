import { Schema, model } from "mongoose";

const GradeSchema = new Schema(
  {
    grade: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Grade", GradeSchema);
