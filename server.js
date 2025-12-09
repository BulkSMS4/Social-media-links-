const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// File to store submissions locally
const DATA_FILE = path.join(__dirname, "submission.json");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ---------- Telegram CONFIG ---------- */
const TELEGRAM_BOT_TOKEN = "7540369556:AAH7gDIVcjCRomnXQgLBGkbk5qF6BUdCjX4";
const TELEGRAM_CHAT_ID = "7635429842";

/* ---------- Email CONFIG ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourgmail@gmail.com",
    pass: "APP_PASSWORD_ONLY"
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
  for (let k in data) {
    text += `${k}: ${data[k]}\n`;
  }

  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text
    })
  }).catch(() => {});
}

function sendEmail(data) {
  let body = "";
  for (let k in data) {
    body += `${k}: ${data[k]}\n`;
  }

  transporter.sendMail({
    from: "Form Alert <yourgmail@gmail.com>",
    to: "youremail@gmail.com",
    subject: "New Form Submission",
    text: body
  }).catch(() => {});
}

/* ---------- Submit Endpoint ---------- */
app.post("/submit", (req, res) => {
  const submission = {
    time: new Date().toISOString(),
    ...req.body
  };

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

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
