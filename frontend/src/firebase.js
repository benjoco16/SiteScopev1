import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

async function getSW() {
  if (!("serviceWorker" in navigator)) return null;
  return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

export async function requestPermissionAndToken() {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("FCM not supported in this browser");
      return null;
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log("Notification permission denied");
        return null;
      }
    } else if (Notification.permission === 'denied') {
      console.log("Notification permission denied");
      return null;
    }

    const swReg = await getSW();
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg || undefined,
    });
    
    if (token) {
      console.log("✅ FCM token generated successfully");
      // Save token to backend
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/save-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ token })
        });
        
        if (response.ok) {
          console.log("✅ FCM token saved to backend");
        } else {
          console.error("❌ Failed to save FCM token to backend");
        }
      } catch (error) {
        console.error("❌ Error saving FCM token:", error);
      }
    }
    
    return token || null;
  } catch (err) {
    console.error("FCM permission/token error:", err);
    return null;
  }
}

export function onForegroundMessage(cb) {
  isSupported().then((ok) => {
    if (!ok) return;
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => cb?.(payload));
  });
}
