import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AsyncError from "../middleware/AsyncError.js";
import multer from "multer";
import xlsx from "xlsx";
import { v4 as uuidv4 } from "uuid";
import ErrorHandler from "../middleware/ErrorHandler.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/Authenticator.js";
import fs from "fs";
import Exam from "../models/Exam.js";
import Answer from "../models/Answer.js";
import Questions from "../models/Questions.js";
import Payment from "../models/Payment.js";

const router = express.Router();

// Konfigurasi multer untuk upload file Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + file.originalname);
  },
});

const upload = multer({ storage: storage });

// LOGIN ADMIN
router.post(
  "/admin/login",
  AsyncError(async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.body.username });

      if (!user) {
        return res.status(404).json({ message: "Username Salah" });
      }

      const isPasswordValid = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(404).json({ message: "Password tidak sesuai" });
      }

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

      return res.status(200).json({
        _id: user._id,
        user: user.name,
        username: user.username,
        role: user.role,
        token: token,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// ADMIN PROFILE
router.get(
  "/admin/profile/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const admin = await User.findById(req.params.id);

      res.status(200).json(admin);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// UPDATE PROFILE ADMIN
router.put(
  "/admin/update-profile/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { name, username, password } = req.body;

      const admin = await User.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      // Update name and username if provided
      if (name) {
        admin.name = name;
      }
      if (username) {
        admin.username = username;
      }

      // Update password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
      }

      await admin.save();

      res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// LOGIN SISWA DAN GURU
router.post(
  "/login",
  AsyncError(async (req, res, next) => {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(404).json({ message: "Username Salah" });
    }

    if (user.password !== req.body.password) {
      return res.status(404).json({ message: "Password Salah" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      nis: user.nis,
      major: user.major,
      grade: user.grade,
      class: user.class,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      token: token,
    });
  })
);

// PROFILE
router.get(
  "/profile",
  authenticateToken,
  AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Username Salah" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      nis: user.nis,
      major: user.major,
      grade: user.grade,
      class: user.class,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
    });
  })
);

// MEMBUAT AKUN SISWA
router.post(
  "/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const hashedPasswords = await bcrypt.hash(req.body.password, 10);

      const user = new User({
        name: req.body.name,
        username: req.body.username,
        password: hashedPasswords,
        nis: req.body.nis,
        class: req.body.class,
        grade: req.body.grade,
        email: req.body.email,
        phone: req.body.phone,
      });

      await user.save();

      return res.status(201).json({ user, message: "Berhasil ditambahkan" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MEMBUAT AKUN SISWA DENGAN UPLOAD EXCEL
router.post(
  "/upload",
  authenticateToken,
  authorizeAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      let savedCount = 0;

      for (const item of data) {
        const user = new User({
          nis: item.nis,
          name: item.nama,
          major: item.jurusan,
          grade: item.tingkat,
          class: item.kelas,
          username: item.username,
          password: item.password,
        });

        await user.save();

        savedCount++;
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        message: `${savedCount} user berhasil disimpan`,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// DETAIL SISWA
router.get(
  "/student/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const student = await User.findById(req.params.id);

      if (!student) {
        return next(new ErrorHandler("Siswa tidak ditemukan", 404));
      }

      return res.status(200).json(student);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENG-UPDATE SISWA
router.put(
  "/student/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let student = await User.findById(req.params.id);

      if (!student) {
        return next(new ErrorHandler("Siswa tidak ditemukan", 404));
      }

      student = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res
        .status(200)
        .json({ message: "Siswa berhasil diupdate", student });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENAMPILKAN SELURUH SISWA
router.get(
  "/students/all",
  AsyncError(async (req, res, next) => {
    try {
      const students = await User.find({ role: "siswa" })
        .populate("class")
        .populate("major");

      return res.status(200).json({ total: students.length, students });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS PER SISWA
router.delete(
  "/student/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const student = await User.findById(req.params.id);

      if (!student) {
        return next(new ErrorHandler("Siswa tidak ditemukan", 404));
      }

      await Payment.deleteMany({ user: student._id });

      await Answer.deleteMany({ user: student._id });

      await student.deleteOne();

      res.status(200).json({ message: "Siswa berhasil dihapus" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS SELURUH SISWA
router.delete(
  "/students/delete",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      // find all users with role "student"
      const users = await User.deleteMany({ role: "siswa" });

      await Payment.deleteMany({});

      await Answer.deleteMany({ user: student._id });

      // send success response
      return res
        .status(200)
        .json({ message: `${users.deletedCount} siswa berhasil dihapus` });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MEMBUAT AKUN GURU
router.post(
  "/teacher/create",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const user = new User({
        avatar: req.body.avatar,
        name: req.body.name,
        mapel: req.body.mapel,
        username: req.body.username,
        password: req.body.password,
        phone: req.body.phone,
        role: "guru",
      });

      await user.save();

      return res.status(201).json({ user, message: "Berhasil ditambahkan" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MEMBUAT AKUN GURU DENGAN UPLOAD EXCEL
router.post(
  "/teacher/upload",
  authenticateToken,
  authorizeAdmin,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      let savedCount = 0;

      for (const item of data) {
        const user = new User({
          name: item.name,
          mapel: item.mapel,
          username: item.username,
          password: item.password,
          phone: item.phone,
          role: "guru",
        });

        await user.save();

        savedCount++;
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        message: `${savedCount} Guru berhasil disimpan`,
      });
    } catch (error) {
      next(new ErrorHandler(error, 500));
      return res.status(500).json({ message: error.message });
    }
  }
);

// DETAIL GURU
router.get(
  "/teacher/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const teacher = await User.findById(req.params.id);

      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan." });
      }

      return res.status(200).json(teacher);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGUPDATE GURU
router.put(
  "/teacher/update/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      let teacher = await User.findById(req.params.id);

      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan." });
      }

      teacher = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Guru berhasil diupdate" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENAMPILKAN SELURUH GURU
router.get(
  "/teachers-all",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const teachers = await User.find({ role: "guru" });

      if (!teachers) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      return res.status(200).json({ total: teachers.length, teachers });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS PER GURU
router.delete(
  "/teacher/delete/:id",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const teacher = await User.findById(req.params.id);

      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }

      const exams = await Exam.find({ user: teacher._id });

      await Answer.deleteMany({
        exam: { $in: exams.map((exam) => exam._id) },
      });

      await Exam.deleteMany({ user: teacher._id });

      await Questions.deleteMany({
        examId: { $in: exams.map((exam) => exam._id) },
      });

      teacher.deleteOne();

      res.status(200).json({ message: "Guru berhasil dihapus" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS SELURUH GURU
router.delete(
  "/teachers/delete",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      // Delete all exams
      await Exam.deleteMany({});

      // Delete all answers
      await Answer.deleteMany({});

      // Delete all question
      await Questions.deleteMany({});

      // find all users with role "student"
      const users = await User.deleteMany({ role: "guru" });

      // send success response
      return res
        .status(200)
        .json({ message: `${users.deletedCount} Guru berhasil dihapus` });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

export default router;
