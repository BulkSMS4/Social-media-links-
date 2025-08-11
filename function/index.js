const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Example HTTP function — change logic as needed
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Cloud Functions!");
});
