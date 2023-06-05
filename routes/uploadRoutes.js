import express from "express";
import multer from "multer";
import { ref, uploadBytes, getStorage, getDownloadURL } from "firebase/storage";
import app from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const storage = getStorage(app);

const memoStorage = multer.memoryStorage();
const upload = multer({ storage: memoStorage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const filePath = `exam/${uuidv4()}-${file.originalname}`;
    const imageRef = ref(storage, filePath);
    const metatype = { contentType: file.mimetype };
    await uploadBytes(imageRef, file.buffer, metatype);
    const downloadURL = await getDownloadURL(imageRef);
    res.status(200).json({ location: downloadURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

router.post("/web-asset/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const filePath = `web/${uuidv4()}-${file.originalname}`;
    const imageRef = ref(storage, filePath);
    const metatype = { contentType: file.mimetype };
    await uploadBytes(imageRef, file.buffer, metatype);
    const downloadURL = await getDownloadURL(imageRef);
    res.status(200).json({ location: downloadURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
