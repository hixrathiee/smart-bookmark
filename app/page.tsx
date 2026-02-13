"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  //  Session handling
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const addBookmark = async () => {
    if (!user) return;

    setErrorMessage("");

    if (!title.trim() || !url.trim()) {
      setErrorMessage("Both title and URL are required.");
      return;
    }

    if (!isValidUrl(url)) {
      setErrorMessage("Please enter a valid URL including https://");
      return;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        {
          title: title.trim(),
          url: url.trim(),
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data) {
      setBookmarks((prev) => [data[0], ...prev]);
      setTitle("");
      setUrl("");
    }
  };

  const deleteBookmark = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this bookmark?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (!error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchBookmarks();

    const channel = supabase.channel("realtime-bookmarks");

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg animate-pulse">Loading...</p>
      </div>
    );
  }

  //  Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-black text-white">
        <div className="bg-gray-800 p-10 rounded-2xl shadow-xl text-center w-96">
          <h1 className="text-3xl font-bold mb-4">Smart Bookmark</h1>
          <p className="text-gray-400 mb-6">
            Save and manage your personal bookmarks securely.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-semibold"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  //  Main app
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-black text-white p-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Smart Bookmark</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">{user.email}</p>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-500 text-sm mt-1"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Bookmark */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Bookmark</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={addBookmark}
              className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-lg font-semibold"
            >
              Add
            </button>
          </div>

          {errorMessage && (
            <p className="text-red-400 mt-3 text-sm">{errorMessage}</p>
          )}
        </div>

        {/* Bookmark List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Bookmarks</h2>

          {bookmarks.length === 0 ? (
            <p className="text-gray-400">No bookmarks yet.</p>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-md"
                >
                  <div>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-medium"
                    >
                      {bookmark.title}
                    </a>
                    <p className="text-gray-400 text-sm">{bookmark.url}</p>
                  </div>

                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
