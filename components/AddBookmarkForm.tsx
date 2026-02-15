"use client";

import { addBookmark } from "@/app/actions/bookmark";
import { useState } from "react";

export default function AddBookmarkForm({
  bookmarkListRef,
}: {
  bookmarkListRef: any;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const newBookmark = await addBookmark(formData);
      bookmarkListRef.current?.addBookmark(newBookmark);
      const broadcastChannel = new BroadcastChannel("bookmarks-refresh");
      broadcastChannel.postMessage({ type: "INSERT", bookmark: newBookmark });
      broadcastChannel.close();

      const form = document.querySelector("form") as HTMLFormElement;
      form?.reset();
    } catch (error) {
      console.error("Error adding bookmark:", error);
      alert("Failed to add bookmark");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium mb-2 text-black"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
          placeholder="My awesome website"
        />
      </div>

      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium mb-2 text-black"
        >
          URL
        </label>
        <input
          type="url"
          id="url"
          name="url"
          required
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
          placeholder="https://example.com"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Adding..." : "Add Bookmark"}
      </button>
    </form>
  );
}
