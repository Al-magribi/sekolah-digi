import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import Activity from "../models/Activity.js";

const router = express.Router();

// MEMBUAT INFORMASI
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const activity = await Activity.create(req.body);

      res.status(200).json({ activity, message: "Berhasil ditambahkan" });
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
      const activity = await Activity.find().sort({ createdAt: -1 });

      res.status(200).json(activity);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// DETAIL Activity
router.get(
  "/:id",
  AsyncError(async (req, res, next) => {
    try {
      const activity = await Activity.findById(req.params.id);

      res.status(200).json(activity);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// MENG-UPDATE Activity
router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let activity = Activity.findById(req.params.id);

      if (!activity) {
        return next(new ErrorHandler("Informasi tidak ditemukan", 404));
      }

      activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json(activity);
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
      const activity = await Activity.findById(req.params.id);

      activity.deleteOne();

      res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
