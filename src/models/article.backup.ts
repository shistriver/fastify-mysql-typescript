  /**
   * 获取所有文章
   */
  static async findAll(page: number = 1, limit: number = 10, filters: { 
    title?: string; 
    status?: string; 
    visibility?: string; 
    isFeatured?: string; 
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