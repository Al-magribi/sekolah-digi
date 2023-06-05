import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorMiddleware from "./middleware/ErrorMiddleware.js";
import MajorRoutes from "./routes/MajorClass.js";
import GradeRoutes from "./routes/GradeRoutes.js";
import ClassRoutes from "./routes/ClassRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import EbookRoutes from "./routes/EbookRoutes.js";
import WebRoutes from "./routes/WebRoutes.js";
import NewsRoutes from "./routes/NewsRoutes.js";
import ActivityRoutes from "./routes/ActivityRoutes.js";
import FeeRoutes from "./routes/FeeRoutes.js";
import PaymentRoutes from "./routes/PaymentRoutes.js";
import ExamRoutes from "./routes/ExamRoutes.js";
import UploadRoute from "./routes/uploadRoutes.js";
import AnswerRoutes from "./routes/AnswerRoutes.js";

const app = express();

// Add CORS middleware
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/major", MajorRoutes);
app.use("/api/grade", GradeRoutes);
app.use("/api/class", ClassRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/ebook", EbookRoutes);
app.use("/api/web", WebRoutes);
app.use("/api/news", NewsRoutes);
app.use("/api/activity", ActivityRoutes);
app.use("/api/fee", FeeRoutes);
app.use("/api/payment", PaymentRoutes);
app.use("/api/exam", ExamRoutes);
app.use("/api/exam/answer", AnswerRoutes);
app.use("/api/images", UploadRoute);

app.use(ErrorMiddleware);

export default app;
