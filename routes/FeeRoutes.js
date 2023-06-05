import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import Fee from "../models/Fee.js";
import Spp from "../models/Spp.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
const router = express.Router();

// MEMBUAT BAYARAN SPP
router.post(
  "/spp/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const amount = req.body.amount; // mendapatkan jumlah pembayaran dari request body
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGU",
      "SEP",
      "OCT",
      "NOV",
      "DES",
    ]; // daftar bulan dalam setahun
    const spp = []; // array untuk menyimpan pembayaran bulanan

    // loop untuk membuat pembayaran bulanan dan menyimpannya dalam array
    months.forEach((month) => {
      spp.push({
        month: month,
        amount: amount,
      });
    });

    // menyimpan pembayaran bulanan ke dalam database
    await Spp.insertMany(spp);

    res.status(200).json({
      message: "Pembayaran bulanan berhasil disimpan ke database",
    });
  })
);

// MENAMPILKAN SELURUH SPP
router.get(
  "/spp-all",
  authenticateToken,
  AsyncError(async (req, res) => {
    const spp = await Spp.find();

    res.status(200).json(spp);
  })
);

// DETAIL SPP
router.get(
  "/spp/:id",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const spp = await Spp.findById(req.params.id);

    if (!spp) {
      return next(new ErrorHandler("Tidak Ditemukan", 404));
    }

    res.status(200).json(spp);
  })
);

// MENGHAPUS DATA SPP
router.delete(
  "/spp/delete-all",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    await Spp.deleteMany({});

    res.status(200).json({
      message: "Semua data pembayaran bulanan berhasil dihapus dari database",
    });
  })
);

// MENAMPILKAN SELURUH PEMBAYARAN
router.get(
  "/all",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const fees = await Fee.find();

    if (!fees) {
      return res.status(404).json({ message: "Pembayaran tidak ditemukan" });
    }

    res.status(200).json(fees);
  })
);

// MEMBUAT JENIS PEMBAYARAN
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const fee = await Fee.create(req.body);

    res.status(200).json({ message: "berhasil dibuat", fee });
  })
);

// DETAIL PEMBAYARAN
router.get(
  "/:id",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: "Tidak ditemukan" });
    }

    res.status(200).json(fee);
  })
);

// MENGUPDATE PEMBAYARAN
router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    let fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: "Tidak ditemukan" });
    }

    fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Berhasil diperbarui" });

    res.status(200).json;
  })
);

// MENGHAPUS PEMBAYARAN
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: "Tidak ditemukan" });
    }

    fee.deleteOne();

    res.status(200).json({ message: "Behasil dihapus" });
  })
);

export default router;
