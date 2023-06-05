import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    avatar: { type: String, required: false },
    name: { type: String, required: [true, "Masukan nama"] },
    username: { type: String, required: [true, "Masukan username"] },
    password: { type: String, required: true },
    nis: { type: String, required: false },
    major: { type: String, required: false },
    grade: { type: String, required: false },
    class: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    mapel: { type: String, required: false },
    role: { type: String, default: "siswa" },
  },
  { timestamps: true }
);

export default model("User", UserSchema);
