import admin from "firebase-admin";
import fs from "fs";

// Load your service account JSON
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    fs.readFileSync("./serviceAccountKey.json", "utf8")
  );
  console.log("✅ Firebase service account loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Firebase service account:", error.message);
  console.error("💡 Make sure serviceAccountKey.json exists in the backend directory");
  process.exit(1);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    process.exit(1);
  }
}

export const fcm = admin.messaging();

// Enhanced push notification function
export async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#0ea5e9', // Primary blue color
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
        },
      },
    };

    const response = await fcm.send(message);
    console.log(`✅ Push notification sent successfully: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`❌ Failed to send push notification:`, error.message);
    
    // Handle specific Firebase errors
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log("🔄 Token is no longer valid, should be removed from database");
      return { success: false, error: 'invalid_token', shouldRemove: true };
    }
    
    return { success: false, error: error.message };
  }
}
