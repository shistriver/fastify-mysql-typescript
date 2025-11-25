export interface Article {
  id: number;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  content: string;
  summary: string;
  authorId: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  visibility: 'public' | 'private' | 'password_protected';
  isFeatured: 1 | 0;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resourceUrl: string;
  downloadPointThreshold: number;
  downloadFileUrl: string;
}

export interface CreateArticleDto {
  title: string;
  subtitle: string;
  coverImageUrl: string;
  content: string;
  summary: string;
  authorId: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  visibility: 'public' | 'private' | 'password_protected';
  isFeatured: 1 | 0;
  resourceUrl: string;
  downloadPointThreshold: number;
  downloadFileUrl: string;
}

export interface UpdateArticleDto {
  title?: string;
  subtitle?: string;
  coverImageUrl?: string;
  content?: string;
  summary?: string;
  authorId?: number;
  status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  visibility?: 'public' | 'private' | 'password_protected';
  isFeatured?: 1 | 0;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishTime?: Date | null;
  resourceUrl?: string;
  downloadPointThreshold?: number;
  downloadFileUrl?: string;
}

export interface ArticleResponse {
  id: number;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  content: string;
  summary: string;
  authorId: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  visibility: 'public' | 'private' | 'password_protected';
  isFeatured: 1 | 0;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resourceUrl: string;
  downloadPointThreshold: number;
  downloadFileUrl: string;
}