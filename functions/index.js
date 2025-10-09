/**
 * functions/index.js
 * Firebase Cloud Function that signs uploads using your Upload.io secret key.
 *
 * Expects the Upload.io secret key to be set as:
 *   firebase functions:config:set uploadio.key="SECRET_KEY_HERE"
 *
 * This file uses the native fetch available on Node 18+ runtimes.
 */

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// init express
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));

// Read Upload.io secret from functions config
// Set via: firebase functions:config:set uploadio.key="SECRET_KEY"
const UPLOADIO_SECRET = functions.config().uploadio && functions.config().uploadio.key;

if (!UPLOADIO_SECRET) {
  console.warn("⚠️ Upload.io secret key not found in functions config (uploadio.key).");
}

/**
 * POST /sign-upload
 * Request body (optional):
 *   { "filename": "myfile.apk", "contentType": "application/octet-stream" }
 *
 * Response:
 *   {
 *     uploadUrl: "...",      // URL the client should POST the file to
 *     headers: {...},        // any headers required for the upload (if any)
 *     expiresAt: 1234567890  // timestamp (ms) if returned by Upload.io
 *   }
 */
app.post("/sign-upload", async (req, res) => {
  try {
    if (!UPLOADIO_SECRET) {
      return res.status(500).json({ error: "Server misconfigured: missing Upload.io key." });
    }

    // Build request to Upload.io create-upload endpoint
    // Upload.io: POST https://api.upload.io/v2/accounts/self/uploads
    // docs: returns uploadUrl and optionally headers that must be set for the client upload
    const body = {};

    // Optionally pass filename or metadata from client
    const { filename } = req.body || {};
    if (filename) body.filename = filename;

    // Optionally set expirySeconds (how long the signed URL should be valid)
    body.expiresInSeconds = 300; // 5 minutes

    const resp = await fetch("https://api.upload.io/v2/accounts/self/uploads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPLOADIO_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await resp.json();

    if (!resp.ok) {
      console.error("Upload.io sign error", json);
      return res.status(502).json({ error: "Failed to create signed upload", details: json });
    }

    // Typical response contains: { uploadUrl: "...", headers: {...}, expiresAt: ... }
    return res.json({
      uploadUrl: json.uploadUrl || json.data?.uploadUrl,
      headers: json.headers || json.data?.headers || {},
      expiresAt: json.expiresAt || json.data?.expiresAt || null,
      raw: json
    });
  } catch (err) {
    console.error("sign-upload error", err);
    return res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

exports.signUpload = functions.runWith({ memory: "256MB", timeoutSeconds: 30 }).https.onRequest(app);
