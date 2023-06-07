import express from "express";
import AsyncError from "../middleware/AsyncError.js";
import {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminTeacher,
  authorizeStudent,
} from "../middleware/Authenticator.js";
import Exam from "../models/Exam.js";
import Questions from "../models/Questions.js";
import User from "../models/User.js";
import ErrorHandler from "../middleware/ErrorHandler.js";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Answer from "../models/Answer.js";

const router = express.Router();

// Konfigurasi multer untuk upload file Excel
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/exam");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

// MENAMBAHKAN DATA UJIAN
router.post(
  "/create",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const examExist = await Exam.findOne({ name: req.body.name });

      if (examExist) {
        return res.status(200).json({ message: "Nama ujian tidak boleh sama" });
      }

      const exam = await Exam.create(req.body);

      return res.status(200).json({ message: "Berhasil dibuat", exam });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENAMPILKAN SELURUH DATA UJIAN => ADMIN
router.get(
  "/get-all",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res, next) => {
    try {
      const exam = await Exam.find().sort({ createdAt: -1 }).populate("user");

      if (!exam) {
        return res.status(404).json({ message: "Tidak ada data exam." });
      }

      return res.status(200).json(exam);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENAMPILKAN SEMUA UJIAN YANG DIBUAT GURU
router.get(
  "/teacher/my-exam",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.find({ user: req.user.id })
        .populate("questions")
        .populate("user");

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      return res.status(200).json(exam);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// DETAIL DATA UJIAN BERIKU PERTANYAANNYA
router.get(
  "/:id",
  authenticateToken,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id)
        .populate({ path: "user", select: "-password -username" })
        .populate("questions");

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      return res.status(200).json(exam);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGUPDATE DATA UJIAN
router.put(
  "/update/:id",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      let exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  })
);

// MENGHAPUS UJIAN BESERTA DENGAN PERTANYAANNYA DAN JAWABANNYA
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      await exam.deleteOne();

      await Questions.deleteMany({ examId: req.params.id });

      await Answer.deleteMany({ exam: req.params.id });

      return res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// PERTANYAAN
// MENAMBAHKAN PERTANYAAN KEDALAM UJIAN
router.post(
  "/create-question",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const newQuestion = new Questions(req.body);
      const question = await newQuestion.save();

      const exam = await Exam.findById(req.body.examId);

      exam.questions.push(question._id);

      await exam.save();

      res.status(200).json({ message: "Berhasil ditambahkan" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MEMBUAT PERTANYAAN DENGAN UPLOAD EXCEL
router.post(
  "/:id/question-upload",
  authenticateToken,
  authorizeAdminTeacher,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      let savedCount = 0;
      let questionIds = [];

      const exam = await Exam.findById(req.params.id);

      const questions = data.map((item) => ({
        question: item.pertanyaan,
        img: item.gambar,
        audio: item.audio,
        type: item.type,
        options: {
          A: item.A,
          imgA: item.gambarA,
          B: item.B,
          imgB: item.gambarB,
          C: item.C,
          imgC: item.gambarC,
          D: item.D,
          imgD: item.gambarD,
          E: item.E,
          imgE: item.gambarE,
        },
        answer: item.jawaban,
        examId: exam._id,
      }));

      const savedQuestions = await Questions.insertMany(questions);

      savedCount = savedQuestions.length;
      questionIds = savedQuestions.map((question) => question._id);

      exam.questions = questionIds;

      await exam.save();

      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        message: `${savedCount} Pertanyaan berhasil disimpan`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });

      next(new ErrorHandler(error.message, 500));
    }
  }
);

// MENAMPILKAN SERULUH PERTANYAAN
router.get(
  "/:id/questions-all",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const questions = await Questions.find({ examId: req.params.id });

      res.status(200).json(questions);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// DETAIL PERTANYAAN
router.get(
  "/question/:id",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const question = await Questions.findById(req.params.id);

      if (!question) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      res.status(200).json(question);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGUPDATE PERTANYAAN
router.put(
  "/question/update/:id",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      let question = await Questions.findById(req.params.id);

      if (!question) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      question = await Questions.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ message: "Berhasil diperbarui" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGAPUS SELURUH PERTANYAAN DI DALAM UJIAN
router.delete(
  "/:id/delete-all-questions",
  authenticateToken,
  authorizeAdminTeacher,
  async (req, res) => {
    try {
      const exam = await Exam.findOne({ _id: req.params.id });
      if (!exam) {
        return res.status(404).json({ error: "Data tidak ditemukan" });
      }

      exam.questions = [];
      await exam.save();

      return res.json({ message: "Semua pertanyaan berhasil di hapus" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// // UPLAOD GAMBAR KE SEVER
// router.post(
//   "/asset/upload",
//   authenticateToken,
//   authorizeAdminTeacher,
//   upload.single("file"),
//   async (req, res) => {
//     console.log(req.file);
//     try {
//       const imgFile = req.file.path;
//       const imgFileName = v4() + "." + imgFile.name;
//       const imageStorageRef = ref(storage, `news/${imgFileName}`);
//       const imageUploadTask = uploadBytesResumable(imageStorageRef, imgFile);

//       await Promise.all([imageUploadTask]);

//       const imageData = await getDownloadURL(imageUploadTask.snapshot.ref);

//       res.status(200).json({ location: imageData });
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).send("Upload failed");
//     }
//   }
// );

// MENAMPILKAN UJIAN BERDASARKAN KELAS => HALAMAN SISWA
router.get(
  "/my-exam/:grade",
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      const myExam = await Exam.find({ grade: req.params.grade })
        .populate({ path: "user", select: "-password -username" })
        .sort({ createdAt: -1 });

      const user = await User.findOne({ _id: req.user.id });

      if (user.grade === req.params.grade) {
        return res.status(200).json(myExam);
      } else {
        return res.status(200).json("Ujian belum tersedia");
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// MEMULAI UJIAN DENGAN MENGACAK SOAL
router.get(
  "/:id/start-exam",
  authenticateToken,
  authorizeStudent,
  AsyncError(async (req, res) => {
    // FUNGSI UNTUK MENGACAK PERTANYAAN
    const shuffleArray = (array) => {
      if (!array || array.length === 0) {
        return array;
      }
      // Fungsi untuk mengacak urutan elemen dalam array
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // FUNGSI UNTUK MENGACAK OPSI
    const shuffleOptions = (options) => {
      if (!options || typeof options !== "object") {
        return options;
      }

      const optionKeys = Object.keys(options);
      const shuffledKeys = shuffleArray(optionKeys);
      const shuffledOptions = {};
      shuffledKeys.forEach((key) => {
        shuffledOptions[key] = options[key];
      });
      return shuffledOptions;
    };

    try {
      const exam = await Exam.findById(req.params.id)
        .populate({ path: "user", select: "-password -username" })
        .populate("questions") // Menggunakan populate untuk pertanyaan saja
        .exec();

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      // Mengambil array pertanyaan yang telah dipopulate
      const questions = exam.questions;

      // Mengacak urutan pertanyaan dengan menggunakan fungsi pengacak
      const shuffledQuestions = shuffleArray(questions);

      // Membuat objek Map untuk menyimpan relasi antara _id pertanyaan dan indeks acak
      const questionMap = new Map();
      shuffledQuestions.forEach((question, index) => {
        questionMap.set(question._id.toString(), index);
      });

      // Mengurutkan pertanyaan berdasarkan indeks acak
      exam.questions.sort((a, b) => {
        const indexA = questionMap.get(a._id.toString());
        const indexB = questionMap.get(b._id.toString());
        return indexA - indexB;
      });

      // Mengacak urutan opsi dalam setiap pertanyaan
      exam.questions.forEach((question) => {
        question.options = shuffleOptions(question.options);
      });

      return res.status(200).json(exam);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// LOGGED USER PADA UJIAN
router.post(
  "/:id/logged-user",
  authenticateToken,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      const existingUserIndex = exam.log.findIndex(
        (user) => String(user) === String(req.body.user)
      );
      if (existingUserIndex !== -1) {
        // ObjectId sudah ada dalam array exam.log, hapus yang lama
        exam.log.splice(existingUserIndex, 1);
      }
      exam.log.push(req.body.user);

      await exam.save();

      return res.status(200).json({ message: "Anda berhasil masuk" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS LOG USER
router.delete(
  "/:id/remove-logged-user/:user",
  authenticateToken,
  authorizeAdmin,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.findByIdAndUpdate(req.params.id, {
        $pull: { log: req.params.user },
        new: true,
      });

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      return res.status(200).json({ message: "Berhasil dinonaktifkan" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

// MENGHAPUS JAWABAN SISWA DAN LOG PADA UJIAN
router.delete(
  "/:id/reset-user/:user",
  authenticateToken,
  authorizeAdminTeacher,
  AsyncError(async (req, res) => {
    try {
      const exam = await Exam.findByIdAndUpdate(req.params.id, {
        $pull: { log: req.params.user },
        new: true,
      });

      if (!exam) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      await Answer.deleteOne({ user: req.params.user });

      return res.status(200).json({ message: "Data berhasil dihapus" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

export default router;
