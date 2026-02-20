
import { Bookmark, User } from "../types";

const STORAGE_KEY = 'smart_bookmarks_db';
const AUTH_KEY = 'smart_bookmarks_user';
const SYNC_CHANNEL = 'bookmarks_sync_v1';

const channel = new BroadcastChannel(SYNC_CHANNEL);

export const saveBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  channel.postMessage({ type: 'UPDATE', data: bookmarks });
};

export const getBookmarks = (userId: string): Bookmark[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  const all: Bookmark[] = JSON.parse(data);
  return all.filter(b => b.userId === userId);
};

export const saveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};

export const subscribeToSync = (callback: (bookmarks: Bookmark[]) => void) => {
  const listener = (event: MessageEvent) => {
    if (event.data.type === 'UPDATE') {
      callback(event.data.data);
    }
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
};
