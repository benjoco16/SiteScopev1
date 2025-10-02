/* global importScripts, firebase */
// Use COMPAT builds because we call firebase.messaging()
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA097A6wVgnoSFLo2jLV80PPsGegClx2qo",
  authDomain: "sitescope-8c881.firebaseapp.com",
  projectId: "sitescope-8c881",
  storageBucket: "sitescope-8c881.appspot.com",
  messagingSenderId: "312769450155",
  appId: "1:312769450155:web:7eba7117199a15ff49a7ee",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) self.registration.showNotification(title, { body });
});
