"use client";

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteBookmark } from "@/app/actions/bookmark";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

const BookmarkList = forwardRef(function BookmarkList(
  {
    initialBookmarks,
    userId,
  }: {
    initialBookmarks: Bookmark[];
    userId: string;
  },
  ref,
) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();
  useImperativeHandle(ref, () => ({
    addBookmark: (newBookmark: Bookmark) => {
      setBookmarks((current) => [newBookmark, ...current]);
    },
  }));

  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((current) => {
              const exists = current.some((b) => b.id === payload.new.id);
              if (exists) return current;
              return [payload.new as Bookmark, ...current];
            });
          } else if (payload.eventType === "DELETE") {
            setBookmarks((current) =>
              current.filter((b) => b.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    const broadcastChannel = new BroadcastChannel("bookmarks-refresh");
    broadcastChannel.onmessage = async (event) => {
      if (event.data.type === "INSERT") {
        setBookmarks((current) => {
          const exists = current.some((b) => b.id === event.data.bookmark.id);
          if (exists) return current;
          return [event.data.bookmark, ...current];
        });
      } else if (event.data.type === "DELETE") {
        setBookmarks((current) =>
          current.filter((b) => b.id !== event.data.bookmarkId),
        );
      }
    };
    const pollInterval = setInterval(async () => {
      const newestTimestamp =
        bookmarks[0]?.created_at || new Date(0).toISOString();

      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .gt("created_at", newestTimestamp)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setBookmarks((current) => {
          const newBookmarks = data.filter(
            (newB) => !current.some((b) => b.id === newB.id),
          );
          if (newBookmarks.length > 0) {
            return [...newBookmarks, ...current];
          }
          return current;
        });
      }
    }, 30000);
    return () => {
      supabase.removeChannel(channel);
      broadcastChannel.close();
      clearInterval(pollInterval);
    };
  }, [supabase, userId]);

  async function handleDelete(bookmarkId: string) {
    setDeletingId(bookmarkId);
    try {
      await deleteBookmark(bookmarkId);
      setBookmarks((current) => current.filter((b) => b.id !== bookmarkId));
    } catch (error) {
      alert("Failed to delete bookmark");
    } finally {
      setDeletingId(null);
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No bookmarks yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first bookmark.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {bookmark.title}
            </h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              {bookmark.url}
            </a>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(bookmark.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <button
            onClick={() => handleDelete(bookmark.id)}
            disabled={deletingId === bookmark.id}
            className="ml-4 text-red-600 hover:text-red-800 disabled:text-red-400 disabled:cursor-not-allowed"
          >
            {deletingId === bookmark.id ? "..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
});
export default BookmarkList;
