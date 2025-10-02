// frontend/src/services/notifications.js
export async function ensureNotifyPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const res = await Notification.requestPermission();
    return res === "granted";
  }
  return false;
}

export function notifyStatus(siteUrl, status) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(`Site ${status}`, {
    body: `${siteUrl} is now ${status}`,
    icon: "/icon.png",          // optional
    tag: siteUrl,               // de-dupe per site
    renotify: true,
  });
}
