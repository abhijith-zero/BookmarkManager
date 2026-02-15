"use client";

import { useRef } from "react";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import BookmarkList from "@/components/BookmarkList";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

export default function BookmarksPage({
  bookmarks,
  userId,
}: {
  bookmarks: Bookmark[];
  userId: string;
}) {
  const bookmarkListRef = useRef<any>(null);
  

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Add New Bookmark
          </h2>
          <AddBookmarkForm bookmarkListRef={bookmarkListRef} />
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Your Bookmarks
          </h2>
          <BookmarkList
            ref={bookmarkListRef}
            initialBookmarks={bookmarks}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}