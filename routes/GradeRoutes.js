import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminTeacher,
} from "../middleware/Authenticator.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import Grade from "../models/Grade.js";
import User from "../models/User.js";

const router = express.Router();

// MENAMPILKAN SELURUH TINGKAT
router.get(
  "/get-grade",
  AsyncError(async (req, res, next) => {
    try {
      const grades = await Grade.find().sort({ createdAt: -1 });

      return res.status(200).json(grades);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MEMBUAT TINGKAT
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const grade = await Grade.create(req.body);

      res.status(200).json({ message: "Berhasil dibuat", grade });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  })
);

// Detail tingkat
router.get(
  "/detail/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const detail = await Grade.findById(req.params.id);

    if (!detail) {
      return res.status(404).json({ message: "tidak ditemukan" });
    }

    res.status(200).json(detail);
  })
);

// Menampilkan seluruh siswa dalam tingkat
router.get(
  "/:name",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const students = await User.find({ grade: req.params.name });

      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MENG-UPDATE TINGKAT
router.put(
  "/update/:id",
  AsyncError(async (req, res, next) => {
    try {
      let gradeId = await Grade.findById(req.params.id);

      if (!gradeId) {
        return res.status(404).json({ message: "Tidak ditemukan" });
      }

      gradeId = await Grade.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MENGHAPUS GRADE
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const gradeId = await Grade.findById(req.params.id);

      if (!gradeId) {
        return res.status(404).json({ message: "Tidak ditemukan" });
      }

      gradeId.deleteOne();

      res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
