import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDatabase from "./config/database.js";

connectDatabase();

const PORT = 1000;

app.get("/", (req, res) => {
  res.send("Server is listening" + PORT);
});

app.listen(PORT, () => {
  console.log(`active port: ${PORT} => mode: ${process.env.NODE_ENV}`);
});
