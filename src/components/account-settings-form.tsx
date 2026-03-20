"use client";

import { FormEvent, useState } from "react";

type AccountSettingsFormProps = {
  initialDisplayName: string;
  roleLabel: string;
};

export function AccountSettingsForm({ initialDisplayName, roleLabel }: AccountSettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/account/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      if (!response.ok) {
        setProfileMessage("Could not save settings.");
        return;
      }

      setProfileMessage("Settings saved.");
    } catch {
      setProfileMessage("Request failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setPasswordMessage(null);

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setPasswordMessage(payload.message ?? "Could not change password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password updated.");
    } catch {
      setPasswordMessage("Request failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-5 space-y-5">
      <p className="text-sm text-slate-600">Role: <span className="font-semibold text-slate-800">{roleLabel}</span></p>

      <form className="space-y-3" onSubmit={handleProfileSubmit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="input-base"
          type="text"
          maxLength={40}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How your name should appear"
        />
        <button className="btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save profile"}
        </button>
        {profileMessage ? <p className="text-sm text-slate-600">{profileMessage}</p> : null}
      </form>

      <form className="space-y-3" onSubmit={handlePasswordSubmit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          className="input-base"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />

        <label className="block text-sm font-medium text-slate-700" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          className="input-base"
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />

        <button className="btn-primary !bg-slate-700 hover:!bg-slate-900" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Change password"}
        </button>
        {passwordMessage ? <p className="text-sm text-slate-600">{passwordMessage}</p> : null}
      </form>
    </div>
  );
}
