import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminTeacher,
  authorizeStudent,
} from "../middleware/Authenticator.js";
import Answer from "../models/Answer.js";

const router = express.Router();

// MENYINPAN JAWABAN SISWA KE DALAM DATABASE
router.post(
  "/student-answer/save",
  authenticateToken,
  authorizeStudent,
  AsyncError(async (req, res) => {
    try {
      const essay = isNaN(req.body.scoreEssay) ? 0 : req.body.scoreEssay;

      const finalScore = req.body.scorePg + essay;

      const answer = await Answer.create({
        user: req.body.user,
        exam: req.body.exam,
        answer: req.body.answer,
        scorePg: req.body.scorePg,
        scoreEssay: essay,
        finalScore: finalScore,
      });

      return res
        .status(200)
        .json({ message: "Jawaban anda berhasil disimpan", answer });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENAMPILKAN SELURUH JAWABAN SISWA
router.get(
  "/admin/get-all",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const answers = await Answer.find();

      return res.status(200).json(answers);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// JWABAN SISWA UNTUK SEMUA UJIAN
router.get(
  "/my-answers",
  authenticateToken,
  AsyncError(async (req, res) => {
    try {
      const myAnswers = await Answer.find({ user: req.user.id })
        .select("-answer")
        .populate({ path: "user", select: "-username -password" })
        .populate({
          path: "exam",
          select:
            "-tokenIn -tokenOut -log -questions -durations -choice -essay",
          populate: {
            path: "user",
            select: "-username -password -role",
          },
        });

      if (!myAnswers) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      return res.status(200).json(myAnswers);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

export default router;
