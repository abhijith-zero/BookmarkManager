"use client";

import { signOut } from "@/app/actions/auth";

export default function SignOutButton() {
  async function handleSignOut() {
    await signOut();
  }

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-2 text-sm text-blue-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}
