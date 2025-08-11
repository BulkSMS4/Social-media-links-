const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Example Cloud Function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Cloud Functions!");
});
