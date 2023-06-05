import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import Major from "../models/Major.js";
import User from "../models/User.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";

const router = express.Router();

// Menampilkan seluruh jurusan
router.get(
  "/get-majors",
  AsyncError(async (req, res) => {
    try {
      const major = await Major.find();

      res.status(200).json({ total: major.length, major });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  })
);

// Membuat Jurusan
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const major = await Major.create(req.body);

      res.status(200).json({ major, message: "Kelas Berhasil dibuat" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  })
);

// Menampilkan seluruh siswa dalam jurusan
router.get(
  "/:id",
  AsyncError(async (req, res) => {
    try {
      const students = await User.find({ major: req.params.id })
        .populate("class")
        .populate("major");

      res.status(200).json({ total: students.length, students });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  })
);

// Detail Jurusan
router.get(
  "/detail/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const detail = await Major.findById(req.params.id);

    if (!detail) {
      return next(new ErrorHandler("Data tidak ditemukan", 404));
    }

    res.status(200).json(detail);
  })
);

router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let major = await Major.findById(req.params.id);

      if (!major) {
        return next(new ErrorHandler("Kelas tidak ditemukan", 404));
      }

      major = await Major.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Kelas berhasil diperbarui" });
    } catch (error) {
      return next(new ErrorHandler(error, 404));
    }
  })
);

router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const major = await Major.findById(req.params.id);

      major.deleteOne();

      res.status(200).json({ message: "Kelas berhasil dihapus" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
