import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import Web from "../models/Web.js";

const router = express.Router();

// MEMBUAT DATA WEB
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const web = await Web.create(req.body);

      res.status(200).json(web);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// MENDAPATKAN DATA WEB
router.get(
  "/data",
  AsyncError(async (req, res, next) => {
    try {
      const web = await Web.find();

      res.status(200).json(web);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// DETAIL WEB
router.get(
  "/:id",
  AsyncError(async (req, res, next) => {
    try {
      const web = await Web.findById(req.params.id);

      if (!web) {
        return next(new ErrorHandler("Data tidak ditemukan", 404));
      }

      res.status(200).json(web);
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

// UPDATE WEB
router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let web = await Web.findById(req.params.id);

      if (!web) {
        return next(new ErrorHandler("Data tidak ditemukan", 404));
      }

      web = await Web.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return next(new ErrorHandler(error, 500));
    }
  })
);

export default router;
