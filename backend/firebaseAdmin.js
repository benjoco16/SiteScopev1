import admin from "firebase-admin";
import fs from "fs";

// Load your service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const fcm = admin.messaging();
