import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import News from "../models/News.js";

const router = express.Router();

// MEMBUAT INFORMASI
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const news = await News.create(req.body);

      res.status(200).json({ message: "Berhasil ditambahkan", news });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// MENAMPILKAN SELURUH INFORMASI
router.get(
  "/all",
  AsyncError(async (req, res, next) => {
    try {
      const news = await News.find().sort({ createdAt: -1 });

      res.status(200).json(news);
    } catch (error) {
      next(new ErrorHandler(error, 500));

      res.status(500).json({ message: error.message });
    }
  })
);

// DETAIL NEWS
router.get(
  "/:title",
  AsyncError(async (req, res, next) => {
    try {
      const news = await News.findOne({ title: req.params.title });

      res.status(200).json(news);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// MENG-UPDATE NEWS
router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let news = News.findById(req.params.id);

      if (!news) {
        return next(new ErrorHandler("Informasi tidak ditemukan", 404));
      }

      news = await News.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// MENGHAPUS INFORMASI
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const news = await News.findById(req.params.id);

      if (!news) {
        return next(new ErrorHandler("Data tidak ditemukan", 404));
      }

      news.deleteOne();

      res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
