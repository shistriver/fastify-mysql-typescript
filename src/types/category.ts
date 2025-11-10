import { Static, Type } from '@sinclair/typebox'; // Fastify 推荐的验证库
import { RowDataPacket, FieldPacket, ResultSetHeader } from 'mysql2';

// 分类创建请求体的类型定义
export const CreateCategoryBodySchema = Type.Object({
  parent_id: Type.Integer({ 
    minimum: 0, 
    description: '父分类ID，0表示一级分类' 
  }),
  category_name: Type.String({ 
    minLength: 1, 
    maxLength: 100, 
    description: '分类名称' 
  }),
  category_code: Type.Optional(
    Type.String({ 
      maxLength: 50, 
      description: '分类编码（唯一）' 
    })
  ),
  description: Type.Optional(Type.String({ description: '分类描述' })),
  icon_url: Type.Optional(Type.String({ description: '图标链接' })),
  sort_order: Type.Integer({ 
    minimum: 0, 
    default: 0, 
    description: '排序权重，数字越大越靠前' 
  }),
  status: Type.Enum({ 
    active: 'active', 
    inactive: 'inactive' 
  }, { default: 'active' }),
  level: Type.Integer({ 
    minimum: 1, 
    maximum: 3, 
    description: '分类层级（1-3级）' 
  }),
});

// 请求验证规则（用于路由schema）
export const CreateCategorySchema = {
  body: CreateCategoryBodySchema,
  response: {
    201: Type.Object({
      success: Type.Boolean(),
      message: Type.String(),
    }),
    500: Type.Object({
      success: Type.Boolean(),
      message: Type.String(),
      error: Type.String()
    })
  }
};

// 新增：创建分类的请求体类型
export interface CreateCategory {
  parent_id: number; // 父分类ID（0表示一级分类）
  category_name: string;
  category_code?: string;
  description?: string;
  icon_url?: string;
  sort_order?: number;
  status?: CategoryStatus;
  level: number; // 分类层级（1-3）
}

// 新增：更新分类的请求体类型（部分字段可选）
export interface UpdateCategoryBody {
  parent_id?: number;
  category_name?: string;
  category_code?: string;
  description?: string;
  icon_url?: string;
  sort_order?: number;
  status?: CategoryStatus;
  level?: number;
}

export enum CategoryStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export interface Category {
  category_id: bigint;
  parent_id: bigint;
  category_name: string;
  category_code?: string | null;
  description?: string | null;
  icon_url?: string | null;
  sort_order: number;
  status: CategoryStatus;
  level: number;
  created_by: bigint;
  updated_by: bigint;
  created_at: Date;
  updated_at: Date;
}

export interface GetCategoriesQuery {
  parent_id?: number;
  status?: CategoryStatus;
  level?: number;
  page?: number;
  limit?: number;

  // 新增：搜索参数
  keyword?: string; // 搜索关键词
  search_fields?: 'name' | 'code' | 'name,code'; // 搜索字段（默认搜索名称）
}

// 新增：树形结构分类接口
export interface CategoryTreeNode extends Omit<Category, 'parent_id'> {
  parent_id: bigint;
  children?: CategoryTreeNode[]; // 子分类列表
}

// 导出TypeScript类型（用于类型提示）
export type CreateCategoryBody = Static<typeof CreateCategoryBodySchema>;
export type QueryResult<T> = [T & RowDataPacket[], FieldPacket[]];
export type CommandResult<T = ResultSetHeader> = [T, FieldPacket[]];