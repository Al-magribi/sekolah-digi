import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminTeacher,
} from "../middleware/Authenticator.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import Class from "../models/Class.js";
import User from "../models/User.js";

const router = express.Router();

// MENAMPILKAN SELURUH KELAS
router.get(
  "/get-class",
  AsyncError(async (req, res, next) => {
    try {
      const classes = await Class.find().sort({ createdAt: -1 });

      return res.status(200).json(classes);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MEMBUAT KELAS
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const className = await Class.create(req.body);

      res.status(200).json({ message: "Kelas Berhasil dibuat", className });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  })
);

// Detail kelas
router.get(
  "/detail/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const detail = await Class.findById(req.params.id);

    if (!detail) {
      return next(new ErrorHandler("Data tidak ditemukan", 404));
    }

    res.status(200).json(detail);
  })
);

// Menampilkan seluruh siswa dalam kelas
router.get(
  "/:name",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const students = await User.find({ class: req.params.name });

      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MENG-UPDATE KELAS
router.put(
  "/update/:id",
  AsyncError(async (req, res, next) => {
    try {
      let classId = await Class.findById(req.params.id);

      if (!classId) {
        return next(new ErrorHandler("Kelas tidak ditemukan", 404));
      }

      classId = await Class.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Kelas berhasil diperbarui" });
    } catch (error) {
      return next(new ErrorHandler(error, 404));
    }
  })
);

// MENGHAPUS KELAS
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const classId = await Class.findById(req.params.id);

      classId.deleteOne();

      res.status(200).json({ message: "Kelas berhasil dihapus" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
