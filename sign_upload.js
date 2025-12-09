// functions/signUpload.js
const functions = require("firebase-functions");
const axios = require("axios");

exports.getUploadUrl = functions.https.onRequest(async (req, res) => {
  // Use your Upload.io secret key safely stored in environment variables
  const uploadioSecret = process.env.UPLOADIO_SECRET;

  if (!uploadioSecret) {
    return res.status(500).json({ error: "Missing Upload.io secret key" });
  }

  try {
    // Ask Upload.io for a one-time signed upload URL
    const response = await axios.post(
      "https://api.bytescale.com/v2/accounts/~your_account_id~/uploads/form_data",
      {
        expiry: "2h", // expires in 2 hours
        path: "/uploads/${filename}",
        permissions: ["upload"],
      },
      {
        headers: {
          Authorization: `Bearer ${uploadioSecret}`,
        },
      }
    );

    return res.json({
      success: true,
      uploadUrl: response.data.uploadUrl,
      fields: response.data.fields,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});
