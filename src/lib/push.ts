import { supabase } from "./supabase";

/**
 * Browser push notifications. Subscribing stores the browser's push
 * subscription (endpoint + keys) in `push_subscriptions`, so an admin tool
 * or server job can later send real pushes via the Web Push protocol using
 * VAPID keys. This module only handles the browser-side subscribe flow —
 * it does not send pushes itself.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** Subscribes the current browser to push and stores it for this user. Requires a VAPID public key (set by the admin). */
export async function subscribeToPush(userId: string, vapidPublicKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "Push notifications aren't supported in this browser." };
  if (!vapidPublicKey) return { ok: false, error: "Push isn't configured by the admin yet." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Notification permission was not granted." };

  try {
    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }
    const json = sub.toJSON();
    await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: json.endpoint || "",
        p256dh: json.keys?.p256dh || "",
        auth: json.keys?.auth || "",
      },
      { onConflict: "user_id,endpoint" }
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't subscribe to push." };
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}
