import React, { useState, useEffect } from "react";
import { Bookmark, User } from "./types";
import {
  getUser,
  saveUser,
  getBookmarks,
  saveBookmarks,
  subscribeToSync,
} from "./services/storage";
import { analyzeLink } from "./services/geminiService";
import { BookmarkCard } from "./components/BookmarkCard";
import "./App.css"

const GOOGLE_CLIENT_ID =
  "934197039537-j593ah1v4r45o3h0a54qmabbvmp2kovr.apps.googleusercontent.com";

declare global {
  interface Window {
    google: any;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getUser());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------------- URL VALIDATION ---------------- */

  const isValidUrl = (url: string) => {
    try {
      const testUrl = url.startsWith("http") ? url : `https://${url}`;
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  };

  /* ---------------- GOOGLE AUTH ---------------- */

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    const btn = document.getElementById("googleSignInDiv");

    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        theme: "outline",
        size: "large",
      });
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    const data = parseJwt(response.credential);

    const realUser: User = {
      id: data.sub,
      name: data.name,
      email: data.email,
      avatar: data.picture,
    };

    saveUser(realUser);
    setUser(realUser);
  };

  const parseJwt = (token: string) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  };

  const handleLogout = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    saveUser(null);
    setUser(null);
  };

  /* ---------------- BOOKMARKS ---------------- */

  useEffect(() => {
    if (user) {
      setBookmarks(getBookmarks(user.id));
    } else {
      setBookmarks([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSync((allBookmarks) => {
      const userBookmarks = allBookmarks.filter((b) => b.userId === user.id);
      setBookmarks(userBookmarks);
    });

    return unsubscribe;
  }, [user]);

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !user) return;

    if (!isValidUrl(newUrl)) {
      alert("Invalid URL. Please enter a valid website.");
      return;
    }

    const normalizedUrl = newUrl.startsWith("http")
      ? newUrl
      : `https://${newUrl}`;

    setIsLoading(true);

    try {
      const analysis = await analyzeLink(normalizedUrl);

      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        url: normalizedUrl,
        title: analysis.title,
        description: analysis.summary,
        tags: analysis.tags,
        createdAt: Date.now(),
        userId: user.id,
      };

      const fullListRaw = localStorage.getItem("smart_bookmarks_db");
      const fullList: Bookmark[] = fullListRaw ? JSON.parse(fullListRaw) : [];

      saveBookmarks([...fullList, newBookmark]);

      setBookmarks((prev) => [newBookmark, ...prev]);
      setNewUrl("");
    } catch {
      alert("Failed to analyze link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const fullListRaw = localStorage.getItem("smart_bookmarks_db");
    const fullList: Bookmark[] = fullListRaw ? JSON.parse(fullListRaw) : [];

    saveBookmarks(fullList.filter((b) => b.id !== id));
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBookmarks = bookmarks
    .filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  /* ---------------- LOGIN SCREEN ---------------- */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center w-[90%] max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Smart Bookmark AI</h1>
          <p className="text-slate-500 text-sm mb-6">
            Organize & understand websites using AI
          </p>
          <div id="googleSignInDiv" className="flex justify-center" />
        </div>
      </div>
    );
  }

  /* ---------------- MAIN APP ---------------- */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              className="w-9 h-9 rounded-full ring-2 ring-slate-100"
            />
            <div className="leading-tight">
              <p className="text-sm text-slate-500">Welcome back</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add Bookmark */}
        <form
          onSubmit={handleAddBookmark}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste website URL..."
            className="flex-1 border border-slate-200 bg-white px-4 py-2.5 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl
                       transition disabled:opacity-50"
          >
            {isLoading ? "Analyzing..." : "Add Bookmark"}
          </button>
        </form>

        {/* Search */}
        <input
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl mb-6
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={handleDelete}
            />
          ))}

          {filteredBookmarks.length === 0 && (
            <p className="text-slate-400 text-sm text-center col-span-full">
              No bookmarks found.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
