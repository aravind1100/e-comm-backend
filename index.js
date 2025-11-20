import express from "express";
import cors from "cors";
import routes from "./Routes/routes.js";
import dotenv from "dotenv";
import connectDB from "./Database/db.config.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("App is working");
});

//Routes
app.use("/api", routes);

app.listen(process.env.PORT, () => {
  console.log("App is listening in the port", process.env.PORT);
});
