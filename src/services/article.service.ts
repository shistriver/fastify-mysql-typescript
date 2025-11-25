import { ArticleModel } from '../models/article';
import { Article, CreateArticleDto, UpdateArticleDto, ArticleResponse } from '../types/article';

export class ArticleService {
  /**
   * 创建文章
   */
  async createArticle(articleData: CreateArticleDto): Promise<ArticleResponse> {
    // 检查标题是否已存在
    const isTitleExists = await ArticleModel.isTitleExists(articleData.title);
    if (isTitleExists) {
      throw new Error('文章标题已存在');
    }
    
    const article = await ArticleModel.create(articleData);
    return this.toArticleResponse(article);
  }

  /**
   * 获取所有文章
   */
  async getAllArticles(page: number = 1, limit: number = 10, filters: { 
    title?: string; 
    status?: string; 
    visibility?: string; 
    isFeatured?: boolean; 
  } = {}): Promise<{ articles: ArticleResponse[], total: number }> {
    const { articles, total } = await ArticleModel.findAll(page, limit, filters);
    return {
      articles: articles.map(article => this.toArticleResponse(article)),
      total
    };
  }

  /**
   * 根据ID获取文章
   */
  async getArticleById(id: number): Promise<ArticleResponse | null> {
    const article = await ArticleModel.findById(id);
    return article ? this.toArticleResponse(article) : null;
  }

  /**
   * 更新文章
   */
  async updateArticle(id: number, articleData: UpdateArticleDto): Promise<ArticleResponse | null> {
    // 如果提供了新的标题，检查是否与其他文章重复（排除自己）
    if (articleData.title !== undefined) {
      const existingArticle = await ArticleModel.findById(id);
      if (!existingArticle) {
        return null;
      }
      
      // 只有当新标题与原标题不同时才检查唯一性
      if (articleData.title !== existingArticle.title) {
        const isTitleExists = await ArticleModel.isTitleExists(articleData.title);
        if (isTitleExists) {
          throw new Error('文章标题已存在');
        }
      }
    }
    
    const article = await ArticleModel.update(id, articleData);
    return article ? this.toArticleResponse(article) : null;
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: number): Promise<boolean> {
    return await ArticleModel.delete(id);
  }
  
  /**
   * 批量删除文章
   */
  async deleteArticles(ids: number[]): Promise<boolean> {
    return await ArticleModel.deleteBatch(ids);
  }

  /**
   * 根据状态获取文章
   */
  async getArticlesByStatus(status: string, page: number = 1, limit: number = 10): Promise<{ articles: ArticleResponse[], total: number }> {
    const { articles, total } = await ArticleModel.findByStatus(status, page, limit);
    return {
      articles: articles.map(article => this.toArticleResponse(article)),
      total
    };
  }

  /**
   * 获取推荐文章
   */
  async getFeaturedArticles(page: number = 1, limit: number = 10): Promise<{ articles: ArticleResponse[], total: number }> {
    const { articles, total } = await ArticleModel.findFeatured(page, limit);
    return {
      articles: articles.map(article => this.toArticleResponse(article)),
      total
    };
  }

  /**
   * 转换为响应格式
   */
  private toArticleResponse(article: Article): ArticleResponse {
    return {
      id: article.id,
      title: article.title,
      subtitle: article.subtitle,
      coverImageUrl: article.coverImageUrl,
      content: article.content,
      summary: article.summary,
      authorId: article.authorId,
      status: article.status,
      visibility: article.visibility,
      isFeatured: article.isFeatured,
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      publishTime: article.publishTime,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      resourceUrl: article.resourceUrl,
      downloadPointThreshold: article.downloadPointThreshold,
      downloadFileUrl: article.downloadFileUrl
    };
  }
}

// 创建服务实例
export const articleService = new ArticleService();