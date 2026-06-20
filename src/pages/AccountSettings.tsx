import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { fetchSettings } from "../lib/data";
import { isPushSupported, getPushPermissionState, subscribeToPush, unsubscribeFromPush } from "../lib/push";
import { Button, Input, Card } from "../components/ui";

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState(profile?.email || "");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushSupported] = useState(isPushSupported());
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [vapidKey, setVapidKey] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    getPushPermissionState().then(setPushPermission);
    fetchSettings().then((s) => setVapidKey(s.vapid_public_key || ""));
  }, []);

  if (!user) { navigate("/auth"); return null; }

  async function togglePush() {
    if (!user) return;
    setPushBusy(true);
    if (pushPermission === "granted") {
      await unsubscribeFromPush(user.id);
      setPushPermission("default");
      toast("Push notifications turned off", "info");
    } else {
      const res = await subscribeToPush(user.id, vapidKey);
      if (res.ok) { setPushPermission("granted"); toast("Push notifications enabled 🔔", "success"); }
      else toast(res.error || "Couldn't enable push notifications", "error");
    }
    setPushBusy(false);
  }

  async function changeEmail() {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast(error.message, "error");
    else toast("Confirmation sent to new email", "success");
    setBusy(false);
  }
  async function changePassword() {
    if (pw.length < 6) { toast("Min 6 characters", "error"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast(error.message, "error");
    else { toast("Password updated ✅", "success"); setPw(""); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings 🔐</h1>

      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white">Change email</h3>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={changeEmail} disabled={busy}>Update email</Button>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white">Change password</h3>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
        <Button onClick={changePassword} disabled={busy}>Update password</Button>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white">Push notifications 🔔</h3>
        {!pushSupported ? (
          <p className="text-sm text-slate-500">Not supported in this browser.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">Get notified instantly about order approvals, messages, and announcements — even when the app is closed.</p>
            <Button onClick={togglePush} disabled={pushBusy} variant={pushPermission === "granted" ? "outline" : "primary"}>
              {pushBusy ? "Working..." : pushPermission === "granted" ? "Turn off push notifications" : "Enable push notifications"}
            </Button>
          </>
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white">Quick links</h3>
        <div className="grid grid-cols-2 gap-2">
          {[["/profile", "Profile & store"], ["/payouts", "Payouts"], ["/transactions", "Transactions"], ["/support", "Support"]].map(([to, label]) => (
            <Button key={to} variant="outline" onClick={() => navigate(to)}>{label}</Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 border-rose-200 p-5 dark:border-rose-500/30">
        <h3 className="font-bold text-rose-600">Danger zone</h3>
        <Button variant="danger" onClick={() => { signOut(); navigate("/"); }}>Sign out</Button>
      </Card>
    </div>
  );
}
