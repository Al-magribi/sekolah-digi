import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import Payment from "../models/Payment.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
import midtransClient from "midtrans-client";
import User from "../models/User.js";

const router = express.Router();

// SERVER KEY MIDTRANS

// HANDLE PEMBAYARAN DENGAN MIDTRANS
router.post("/transaction", (req, res) => {
  let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.SERVER_KEY,
    clientKey: process.env.CLIENT_KEY,
  });

  let parameter = {
    transaction_details: {
      order_id: req.body.order_id,
      gross_amount: req.body.payment,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: req.body.name,
      email: req.body.email,
    },
    callbacks: {
      finish: "http://localhost:3000/payment/status",
    },
    enabled_payments: [
      "credit_card",
      "mandiri_clickpay",
      "bca_klikbca",
      "bca_klikpay",
      "echannel",
      "permata_va",
      "bca_va",
      "bni_va",
      "other_va",
    ],
  };

  snap
    .createTransaction(parameter)
    .then((transaction) => {
      const dataPayment = {
        midtransResponse: JSON.stringify(transaction),
      };

      let transactionToken = transaction.token;

      res.status(200).json({
        status: true,
        message: "berhasil",
        dataPayment,
        token: transactionToken,
      });
    })
    .catch((e) => {
      res.status(400).json({
        status: false,
        message: "Pembayaran gagal",
        error: e.message,
      });
    });
});

// MEMPERBARUI STATUS PEMBAYARAN DENGAN MINTA RESPONSE DARI MIDTRANS
router.get(
  "/status/:order_id",
  authenticateToken,
  AsyncError(async (req, res) => {
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.SERVER_KEY,
      clientKey: process.env.CLIENT_KEY,
    });

    snap.transaction
      .status(req.params.order_id)
      .then((response) => {
        // do something to `response` object
        res.status(200).json({
          success: true,
          response,
        });
      })
      .catch((error) => {
        res.status(404).json({
          success: false,
          message: "order tidak ditemukan",
          error: error.message,
        });
      });
  })
);

// MENDAPATKAN SEMUA PAYMEN => ADMIN
router.get(
  "/admin/all-payment",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    const payment = await Payment.find()
      .populate({
        path: "user",
        select: "-password", // menghilangkan field password
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json(payment);
  })
);

// LAPORAN HARIAN => ADMIN
router.get(
  "/admin/daily-payment",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;

    const payment = await Payment.find({
      status: "settlement",
      createdAt: {
        $gte: new Date(startDate),
        $lt: new Date(endDate + "T23:59:59.999Z"),
      },
    })
      .populate({
        path: "user",
        select: "-password", // menghilangkan field password
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json(payment);
  })
);

router.get(
  "/admin/data-payment",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    const payment = await Payment.find({
      status: "settlement",
    })
      .populate({
        path: "user",
        select: "-password", // menghilangkan field password
      })
      .sort({
        createdAt: -1,
      });

    if (!payment) {
      return res.status(404).json({ message: "Pembayaran tidak ditemukan" });
    }

    res.status(200).json(payment);
  })
);

// PEMBAYARAN OFFLINE =>
// MENDAPATKAN DATA SISWA
router.get(
  "/get-student",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const users = await User.find({ role: "siswa" });

      const searchTerm = req.query.name || "";

      const query = { name: { $regex: searchTerm, $options: "i" } };

      const students = users.filter((user) => user.name.match(query.name));

      res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// MEMBUAT TRANSAKSI SAYA
router.post(
  "/create",
  authenticateToken,
  AsyncError(async (req, res) => {
    const payment = await Payment.create(req.body);

    res.status(200).json({ message: "Pembayaran berhasil dibuat", payment });
  })
);

// MEMPERBARUI STATUS PEMBAYARAN DALAM DATABASE
router.put(
  `/update-status-payment/:id`,
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const payment = await Payment.findById(req.params.id);

    payment.status = req.body.status;

    await payment.save();
  })
);

// PEMBAYARAN SAYA
router.get(
  "/my",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const myPayment = await Payment.find({ user: req.user.id })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "user",
        select: "-password", // menghilangkan field password
      });

    if (!myPayment) {
      return next(new ErrorHandler("data tidak ditemukan", 404));
    }

    res.status(200).json(myPayment);
  })
);

// DETAIL PAYMENT
router.get(
  "/my/:id",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const detail = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate({
      path: "user",
      select: "-password",
    });

    res.status(200).json(detail);
  })
);

export default router;
