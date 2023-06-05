import jwt from "jsonwebtoken";
import User from "../models/User.js";

// OTENTIKASI USER
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Tidak ada otorisasi" });
  }

  const tokenPrefix = "Bearer ";
  if (!authHeader.startsWith(tokenPrefix)) {
    return res.status(401).json({ message: "Otoritas tidak valid" });
  }

  const token = authHeader.slice(tokenPrefix.length);

  if (!token) {
    return res.status(401).json({ message: "JWT tidak tersedia" });
  }

  const decoded_id = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded_id).select("-password");

  next();
};

// TEACHER
const authorizeTeacher = async (req, res, next) => {
  const username = req.user.username;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "guru") {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki otoritas untuk mengakses ini" });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// STUDENT
const authorizeStudent = async (req, res, next) => {
  const username = req.user.username;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "siswa") {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki otoritas untuk mengakses ini" });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ADMIN
const authorizeAdmin = async (req, res, next) => {
  const username = req.user.username;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki otoritas untuk mengakses ini" });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ADMIN & TEACHER
const authorizeAdminTeacher = async (req, res, next) => {
  const username = req.user.username;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "admin" && user.role !== "guru") {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki otoritas untuk mengakses ini" });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export {
  authenticateToken,
  authorizeAdmin,
  authorizeTeacher,
  authorizeStudent,
  authorizeAdminTeacher,
};
