import { pool } from '../db/mysql';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isAdmin } from '../middlewares/auth.middleware';
import { CreateCategorySchema, CreateCategoryBody, CreateCategory, UpdateCategoryBody } from '../types/category'; // 类型和验证规则
import { GetCategoriesQuery } from '../types/category';
import { categoryService } from '../services/category.service';
// 分类相关路由
export const categoryRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: CreateCategoryBody }>(
    '/add2',
    { 
      schema: CreateCategorySchema,
      preHandler: isAdmin,
     },
    async (request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) => {
      try {
        const payload = await request.jwtVerify<{ member_id: number }>();
        const categoryData = request.body;
        
        // 修正：用对象包裹 sql 和 values 参数
        const result = await pool.execute({
          sql: `INSERT INTO categories (
            parent_id, category_name, category_code, description, 
            icon_url, sort_order, status, level, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            categoryData.parent_id,
            categoryData.category_name,
            categoryData.category_code || null,
            categoryData.description || null,
            categoryData.icon_url || null,
            categoryData.sort_order,
            categoryData.status,
            categoryData.level,
            payload.member_id,
            payload.member_id,
          ]
        });

        reply.code(201).send({
          success: true,
          message: '分类创建成功',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('category_name')) {
          return reply.code(400).send({
            success: false,
            message: `分类名称 "${request.body.category_name}" 已存在，请更换名称`
          });
        }

        // 其他错误（如数据库连接失败等）
        reply.code(500).send({
          success: false,
          message: '创建分类失败',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  // 新增：添加子分类
  app.post<{ Body: CreateCategory }>(
    '/add',
    {
      schema: {
        body: {
          type: 'object',
          required: ['parent_id', 'category_name', 'level'], // 必传字段
          properties: {
            parent_id: { type: 'number', minimum: 0 },
            category_name: { type: 'string', minLength: 1, maxLength: 100 },
            category_code: { type: 'string', maxLength: 50 },
            description: { type: 'string' },
            icon_url: { type: 'string', maxLength: 500 },
            sort_order: { type: 'number', default: 0 },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
            level: { type: 'number', minimum: 1, maximum: 3 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateCategory }>, reply: FastifyReply) => {
      try {
        // 实际项目中，operatorId应从登录用户信息中获取（这里简化为1）
        const operatorId = BigInt(1); 
        const newCategory = await categoryService.createCategory(request.body, operatorId);
        return reply.code(201).send({
          code: 200,
          success: true,
          message: '创建分类成功！',
          data: newCategory
        });
      } catch (error) {
        app.log.error('Failed to create category:' + error);
        return reply.code(400).send({
          code: 400,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create category'
        });
      }
    }
  );
  // 获取分类列表信息
  app.get<{ Querystring: GetCategoriesQuery }>(
    '/list',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            parent_id: { type: 'number' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            level: { type: 'number', minimum: 1, maximum: 3 },
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },

            // 新增：搜索参数验证
            keyword: { type: 'string' }, // 搜索关键词（支持任意字符串）
            search_fields: { 
              type: 'string', 
              enum: ['name', 'code', 'name,code'], // 限制可选值
              default: 'name' 
            }
          }
        }
      },
      preHandler: isAdmin,
    },
    async (request: FastifyRequest<{ Querystring: GetCategoriesQuery }>, reply: FastifyReply) => {
      try {
        const result = await categoryService.getCategories(request.query);
        return reply.code(200).send({
          code: 200,
          message: 'success',
          data: result
        });
      } catch (error) {
        app.log.error('Failed to get categories:' + error);
        return reply.code(500).send({
          code: 500,
          message: 'Failed to get categories'
        });
      }
    }
  );
  // 新增：编辑分类
  app.put<{ Params: { id: number }, Body: UpdateCategoryBody }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number', minimum: 1 }
          }
        },
        body: {
          type: 'object',
          properties: {
            parent_id: { type: 'number', minimum: 0 },
            category_name: { type: 'string', minLength: 1, maxLength: 100 },
            category_code: { type: 'string', maxLength: 50 },
            description: { type: 'string' },
            icon_url: { type: 'string', maxLength: 500 },
            sort_order: { type: 'number' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            level: { type: 'number', minimum: 1, maximum: 3 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: { id: number }, Body: UpdateCategoryBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const operatorId = BigInt(1); // 实际应从登录信息获取
        const updatedCategory = await categoryService.updateCategory(id, request.body, operatorId);
        return reply.code(200).send({
          code: 200,
          success: true,
          message: '分类更新成功',
          data: updatedCategory
        });
      } catch (error) {
        app.log.error('Failed to update category:' + error);
        return reply.code(400).send({
          code: 400,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update category'
        });
      }
    }
  );
  app.delete<{ Params: { id: number }, Querystring: { cascade?: boolean } }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number', minimum: 1 }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            cascade: { type: 'boolean', default: false }
          }
        }
      },
      preHandler: isAdmin,
    },
    async (request: FastifyRequest<{ Params: { id: number }, Querystring: { cascade?: boolean } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { cascade = false } = request.query;
        const result = await categoryService.deleteCategory(id, cascade);
        if (result) {
          return reply.code(200).send({
            code: 200,
            success: true,
            message: '分类删除成功！'
          });
        }
        return reply.code(404).send({
          code: 404,
          success: false,
          message: '找不到该分类！'
        });
      } catch (error) {
        app.log.error('Failed to delete category:' + error);
        return reply.code(400).send({
          code: 400,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete category'
        });
      }
    }
  );
};