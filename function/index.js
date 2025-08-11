const functions = require('firebase-functions');

// A simple HTTP function
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
