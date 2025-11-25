import { pool } from '../db/mysql';
import { Article, CreateArticleDto, UpdateArticleDto } from '../types/article';

export class ArticleModel {
  /**
   * 获取所有文章
   */
  static async findAll(page: number = 1, limit: number = 10, filters: { 
    title?: string; 
    status?: string; 
    visibility?: string; 
    isFeatured?: boolean; 
  } = {}): Promise<{ articles: Article[], total: number }> {
    const offset = (page - 1) * limit;
    
    // 构建WHERE条件
    const whereConditions = [];
    const whereValues = [];
    
    if (filters.title) {
      whereConditions.push('title LIKE ?');
      whereValues.push(`%${filters.title}%`);
    }
    
    if (filters.status) {
      whereConditions.push('status = ?');
      whereValues.push(filters.status);
    }
    
    if (filters.visibility) {
      whereConditions.push('visibility = ?');
      whereValues.push(filters.visibility);
    }
    
    if (filters.isFeatured !== undefined) {
      whereConditions.push('is_featured = ?');
      whereValues.push(filters.isFeatured ? 1 : 0);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 使用字符串拼接而不是参数化查询来调试LIMIT和OFFSET问题
    const query = `SELECT 
      article_id as id, 
      title, 
      subtitle, 
      cover_image_url as coverImageUrl, 
      content, 
      summary, 
      author_id as authorId, 
      status, 
      visibility, 
      is_featured as isFeatured, 
      view_count as viewCount, 
      like_count as likeCount, 
      comment_count as commentCount, 
      publish_time as publishTime, 
      created_at as createdAt, 
      updated_at as updatedAt, 
      resource_url as resourceUrl, 
      download_point_threshold as downloadPointThreshold 
    FROM articles ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, whereValues);
    
    const countQuery = `SELECT COUNT(*) as total FROM articles ${whereClause}`;
    const [totalResult] = await pool.execute(countQuery, whereValues);
    const total = (totalResult as any[])[0].total;
    
    // 处理时间字段，确保NULL值正确处理
    const articles = (rows as any[]).map(row => ({
      ...row,
      publishTime: row.publishTime ? new Date(row.publishTime) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
    
    return {
      articles: articles as Article[],
      total
    };
  }

  /**
   * 通过ID获取文章
   */
  static async findById(id: number): Promise<Article | null> {
    const [rows] = await pool.execute(
      `SELECT 
        article_id as id, 
        title, 
        subtitle, 
        cover_image_url as coverImageUrl, 
        content, 
        summary, 
        author_id as authorId, 
        status, 
        visibility, 
        is_featured as isFeatured, 
        view_count as viewCount, 
        like_count as likeCount, 
        comment_count as commentCount, 
        publish_time as publishTime, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        resource_url as resourceUrl, 
        download_point_threshold as downloadPointThreshold 
      FROM articles WHERE article_id = ?`,
      [id]
    );
    
    if ((rows as any[]).length === 0) {
      return null;
    }
    
    const row = (rows as any[])[0];
    // 处理时间字段，确保NULL值正确处理
    const article = {
      ...row,
      publishTime: row.publishTime ? new Date(row.publishTime) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
    
    return article as Article;
  }

  /**
   * 创建新文章
   */
  static async create(articleData: CreateArticleDto): Promise<Article> {
    const [result] = await pool.execute(
      `INSERT INTO articles (
        title, subtitle, cover_image_url, content, summary, author_id,
        status, visibility, is_featured, resource_url,
        download_point_threshold, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        articleData.title,
        articleData.subtitle,
        articleData.coverImageUrl,
        articleData.content,
        articleData.summary,
        articleData.authorId,
        articleData.status,
        articleData.visibility,
        articleData.isFeatured ? 1 : 0,
        articleData.resourceUrl,
        articleData.downloadPointThreshold,
      ]
    );

    // @ts-ignore
    const newArticleId = result.insertId;
    return this.findById(newArticleId) as Promise<Article>;
  }

  /**
   * 更新文章
   */
  static async update(id: number, articleData: UpdateArticleDto): Promise<Article | null> {
    const existingArticle = await this.findById(id);
    if (!existingArticle) {
      return null;
    }

    // 构建更新字段
    const fields = [];
    const values = [];
    
    if (articleData.title !== undefined) {
      fields.push('title = ?');
      values.push(articleData.title);
    }
    
    if (articleData.subtitle !== undefined) {
      fields.push('subtitle = ?');
      values.push(articleData.subtitle);
    }
    
    if (articleData.coverImageUrl !== undefined) {
      fields.push('cover_image_url = ?');
      values.push(articleData.coverImageUrl);
    }
    
    if (articleData.content !== undefined) {
      fields.push('content = ?');
      values.push(articleData.content);
    }
    
    if (articleData.summary !== undefined) {
      fields.push('summary = ?');
      values.push(articleData.summary);
    }
    
    if (articleData.authorId !== undefined) {
      fields.push('author_id = ?');
      values.push(articleData.authorId);
    }
    
    if (articleData.status !== undefined) {
      fields.push('status = ?');
      values.push(articleData.status);
    }
    
    if (articleData.visibility !== undefined) {
      fields.push('visibility = ?');
      values.push(articleData.visibility);
    }
    
    if (articleData.isFeatured !== undefined) {
      fields.push('is_featured = ?');
      values.push(articleData.isFeatured ? 1 : 0);
    }
    
    if (articleData.viewCount !== undefined) {
      fields.push('view_count = ?');
      values.push(articleData.viewCount);
    }
    
    if (articleData.likeCount !== undefined) {
      fields.push('like_count = ?');
      values.push(articleData.likeCount);
    }
    
    if (articleData.commentCount !== undefined) {
      fields.push('comment_count = ?');
      values.push(articleData.commentCount);
    }
    
    if (articleData.publishTime !== undefined) {
      fields.push('publish_time = ?');
      values.push(articleData.publishTime);
    }
    
    if (articleData.resourceUrl !== undefined) {
      fields.push('resource_url = ?');
      values.push(articleData.resourceUrl);
    }
    
    if (articleData.downloadPointThreshold !== undefined) {
      fields.push('download_point_threshold = ?');
      values.push(articleData.downloadPointThreshold);
    }
    
    // 总是更新更新时间
    fields.push('updated_at = NOW()');
    
    if (fields.length === 0) {
      return existingArticle;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE articles SET ${fields.join(', ')} WHERE article_id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 删除文章
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM articles WHERE article_id = ?', [id]);
    
    // @ts-ignore
    return result.affectedRows > 0;
  }
  
  /**
   * 批量删除文章
   */
  static async deleteBatch(ids: number[]): Promise<boolean> {
    if (ids.length === 0) {
      return false;
    }
    
    // 构建占位符
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM articles WHERE article_id IN (${placeholders})`;
    
    const [result] = await pool.execute(query, ids);
    
    // @ts-ignore
    return result.affectedRows > 0;
  }
  
  /**
   * 根据状态获取文章
   */
  static async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<{ articles: Article[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      // 使用字符串拼接而不是参数化查询来调试LIMIT和OFFSET问题
      const query = `SELECT 
        article_id as id, 
        title, 
        subtitle, 
        cover_image_url as coverImageUrl, 
        content, 
        summary, 
        author_id as authorId, 
        status, 
        visibility, 
        is_featured as isFeatured, 
        view_count as viewCount, 
        like_count as likeCount, 
        comment_count as commentCount, 
        publish_time as publishTime, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        resource_url as resourceUrl, 
        download_point_threshold as downloadPointThreshold 
      FROM articles WHERE status = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await pool.execute(query, [status]);
      
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM articles WHERE status = ?',
        [status]
      );
      const total = (totalResult as any[])[0].total;
      
      // 处理时间字段，确保NULL值正确处理
      const articles = (rows as any[]).map(row => ({
        ...row,
        publishTime: row.publishTime ? new Date(row.publishTime) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
      
      return {
        articles: articles as Article[],
        total
      };
    } catch (error) {
      console.error('findByStatus error:', error);
      throw error;
    }
  }
  
  /**
   * 根据推荐状态获取文章
   */
  static async findFeatured(page: number = 1, limit: number = 10): Promise<{ articles: Article[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      // 使用字符串拼接而不是参数化查询来调试LIMIT和OFFSET问题
      const query = `SELECT 
        article_id as id, 
        title, 
        subtitle, 
        cover_image_url as coverImageUrl, 
        content, 
        summary, 
        author_id as authorId, 
        status, 
        visibility, 
        is_featured as isFeatured, 
        view_count as viewCount, 
        like_count as likeCount, 
        comment_count as commentCount, 
        publish_time as publishTime, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        resource_url as resourceUrl, 
        download_point_threshold as downloadPointThreshold 
      FROM articles WHERE is_featured = 1 AND status = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await pool.execute(query, ['published']);
      
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM articles WHERE is_featured = 1 AND status = ?',
        ['published']
      );
      const total = (totalResult as any[])[0].total;
      
      // 处理时间字段，确保NULL值正确处理
      const articles = (rows as any[]).map(row => ({
        ...row,
        publishTime: row.publishTime ? new Date(row.publishTime) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
      
      return {
        articles: articles as Article[],
        total
      };
    } catch (error) {
      console.error('findFeatured error:', error);
      throw error;
    }
  }
}