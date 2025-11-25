import { FastifyRequest, FastifyReply } from 'fastify';
import { articleService } from '../services/article.service';
import { CreateArticleDto, UpdateArticleDto } from '../types/article';

// 创建文章
export const createArticle = async (request: FastifyRequest<{ Body: CreateArticleDto }>, reply: FastifyReply) => {
  try {
    const articleData = request.body;
    const article = await articleService.createArticle(articleData);
    return reply.status(201).send({
      success: true,
      data: article
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '创建文章失败'
    });
  }
};

// 获取所有文章
export const getAllArticles = async (request: FastifyRequest<{ 
  Querystring: { 
    current?: string; 
    pageSize?: string;
    title?: string;
    status?: string;
    visibility?: string;
    isFeatured?: string;
  } 
}>, reply: FastifyReply) => {
  try {
    const page = parseInt(request.query.current || '1');
    const limit = parseInt(request.query.pageSize || '10');
    
    // 构建过滤条件
    const filters: { 
      title?: string; 
      status?: string; 
      visibility?: string; 
      isFeatured?: string; 
    } = {};
    
    if (request.query.title) {
      filters.title = request.query.title;
    }
    
    if (request.query.status) {
      filters.status = request.query.status;
    }
    
    if (request.query.visibility) {
      filters.visibility = request.query.visibility;
    }
    
    if (request.query.isFeatured) {
      filters.isFeatured = request.query.isFeatured;
    }
    
    const result = await articleService.getAllArticles(page, limit, filters);
    return reply.status(200).send({
      success: true,
      data: result.articles,
      total: result.total,
      current: page,
      pageSize: limit
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '获取文章列表失败'
    });
  }
};

// 根据ID获取文章
export const getArticleById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    const article = await articleService.getArticleById(id);
    
    if (!article) {
      return reply.status(404).send({
        success: false,
        message: '文章不存在'
      });
    }
    
    return reply.status(200).send({
      success: true,
      data: article
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '获取文章失败'
    });
  }
};

// 更新文章
export const updateArticle = async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateArticleDto }>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    const articleData = request.body;
    const article = await articleService.updateArticle(id, articleData);
    
    if (!article) {
      return reply.status(404).send({
        success: false,
        message: '文章不存在'
      });
    }
    
    return reply.status(200).send({
      success: true,
      data: article
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '更新文章失败'
    });
  }
};

// 删除文章
export const deleteArticle = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    const result = await articleService.deleteArticle(id);
    
    if (!result) {
      return reply.status(404).send({
        success: false,
        message: '文章不存在'
      });
    }
    
    return reply.status(200).send({
      success: true,
      message: '文章删除成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '删除文章失败'
    });
  }
};

// 根据状态获取文章
export const getArticlesByStatus = async (request: FastifyRequest<{ Params: { status: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const status = request.params.status;
    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '10');
    const result = await articleService.getArticlesByStatus(status, page, limit);
    return reply.status(200).send({
      success: true,
      data: result.articles,
      total: result.total,
      page,
      limit
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '获取文章列表失败'
    });
  }
};

// 获取推荐文章
export const getFeaturedArticles = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '10');
    const result = await articleService.getFeaturedArticles(page, limit);
    return reply.status(200).send({
      success: true,
      data: result.articles,
      total: result.total,
      page,
      limit
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || '获取推荐文章失败'
    });
  }
};