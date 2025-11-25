import { FastifyInstance } from 'fastify';
import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  deleteArticles,
  getArticlesByStatus,
  getFeaturedArticles
} from '../controllers/article.controller';

export async function articleRoutes(fastify: FastifyInstance) {
  // 创建文章
  fastify.post('/articles', {
    handler: createArticle
  });

  // 获取所有文章
  fastify.get('/articles', {
    handler: getAllArticles
  });

  // 根据ID获取文章
  fastify.get('/articles/:id', {
    handler: getArticleById
  });

  // 更新文章
  fastify.put('/articles/:id', {
    handler: updateArticle
  });

  // 删除文章
  fastify.delete('/articles/:id', {
    handler: deleteArticle
  });

  // 根据状态获取文章
  fastify.get('/articles/status/:status', {
    handler: getArticlesByStatus
  });

  // 获取推荐文章
  fastify.get('/articles/featured', {
    handler: getFeaturedArticles
  });
  
  // 批量删除文章
  fastify.delete('/articles', {
    handler: deleteArticles
  });
}