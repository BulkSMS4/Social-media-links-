// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // For Telegram alerts
const nodemailer = require('nodemailer'); // For email alerts

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON and URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// File to save submissions
const submissionsFile = path.join(__dirname, 'submissions.json');

// Helper to save data
function saveSubmission(data) {
    let submissions = [];
    if (fs.existsSync(submissionsFile)) {
        submissions = JSON.parse(fs.readFileSync(submissionsFile));
    }
    submissions.push(data);
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
}

// Replace with your Telegram Bot Token and Chat ID
const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

// Replace with your email SMTP settings
const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false,
    auth: {
        user: "you@example.com",
        pass: "yourpassword"
    }
});

// Form submission endpoint
app.post('/submit', async (req, res) => {
    const { formId, redirectUrl, ...fields } = req.body;

    const submission = {
        formId,
        fields,
        timestamp: new Date().toISOString()
    };

    // Save locally
    saveSubmission(submission);

    // Telegram alert
    try {
        if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
            const message = `New submission:\n${JSON.stringify(fields, null, 2)}`;
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
            });
        }
    } catch (err) {
        console.log("Telegram error:", err);
    }

    // Email alert
    try {
        if (transporter) {
            await transporter.sendMail({
                from: '"Form Alerts" <you@example.com>',
                to: 'recipient@example.com',
                subject: `New submission for ${formId}`,
                text: JSON.stringify(fields, null, 2)
            });
        }
    } catch (err) {
        console.log("Email error:", err);
    }

    // Redirect
    if (redirectUrl) {
        return res.redirect(redirectUrl);
    }

    res.send({ status: 'success' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
