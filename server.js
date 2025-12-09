import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(process.cwd(), "submission.json");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ---------- Telegram CONFIG ---------- */
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/* ---------- Email CONFIG ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/* ---------- Helpers ---------- */
function saveSubmission(data) {
  let all = [];
  if (fs.existsSync(DATA_FILE)) {
    all = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  all.push(data);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
}

function sendTelegram(data) {
  let text = "📩 NEW FORM SUBMISSION\n\n";
  for (let k in data) text += `${k}: ${data[k]}\n`;

  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
  }).catch(() => {});
}

function sendEmail(data) {
  let body = "";
  for (let k in data) body += `${k}: ${data[k]}\n`;

  transporter.sendMail({
    from: `"Form Alert" <${process.env.GMAIL_USER}>`,
    to: process.env.RECEIVER_EMAIL,
    subject: "New Form Submission",
    text: body
  }).catch(() => {});
}

/* ---------- Submit Endpoint ---------- */
app.post("/submit", (req, res) => {
  const submission = { time: new Date().toISOString(), ...req.body };
  saveSubmission(submission);
  sendTelegram(submission);
  sendEmail(submission);
  res.redirect("/dashboard.html");
});

/* ---------- Dashboard API ---------- */
app.get("/api/submissions", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
});

app.listen(PORT, () => console.log("✅ Server running on port", PORT));
