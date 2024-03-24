import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Express on Vercel"));


app.listen(port, () => {
  console.log("Server ready on port 3000.")
});
