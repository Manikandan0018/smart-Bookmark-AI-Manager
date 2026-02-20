
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AIAnalysis {
  title: string;
  summary: string;
  tags: string[];
}
