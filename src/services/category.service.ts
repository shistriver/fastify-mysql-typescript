import { pool } from '../db/mysql';
import { RowDataPacket } from 'mysql2'; // 引入mysql2的行数据类型
import {
  Category,
  GetCategoriesQuery,
  CommandResult,
  CreateCategory,
  UpdateCategoryBody,
  CategoryStatus,
  CategoryTreeNode,
} from '../types/category';
import { buildCategoryTree } from '../utils/treeHelper'; // 引入树形转换工具
import { MySqlArrayResult } from '../types/mysql'; // 引入自定义查询结果类型

export class CategoryService {
  async getCategories(query: GetCategoriesQuery): Promise<
    { list: CategoryTreeNode[] }
  > {
    const {
      parent_id,
      status,
      level,
      keyword,
      search_fields = 'name'
    } = query;

    // 1. 先查询所有符合基础条件的分类（状态、层级等）
    const baseWhereClauses: string[] = [];
    const baseParams: any[] = [];

    if (status) {
      baseWhereClauses.push('status = ?');
      baseParams.push(status);
    }
    if (level !== undefined) {
      baseWhereClauses.push('level = ?');
      baseParams.push(level);
    }

    const baseWhereSql = baseWhereClauses.length 
      ? `WHERE ${baseWhereClauses.join(' AND ')}` 
      : '';

    // 获取所有符合基础条件的分类（用于后续处理）
    const [allCategories]: MySqlArrayResult<Category> = await pool.query(
      `SELECT * FROM categories ${baseWhereSql}`,
      baseParams
    );

    // 2. 处理搜索逻辑：找到所有匹配关键词的分类ID
    let matchedCategoryIds: number[] = [];
    if (keyword) {
      const searchWhereClauses = [...baseWhereClauses];
      const searchParams = [...baseParams];
      const fields: string[] = [];

      const searchFieldList = search_fields.split(',').map(f => f.trim());
      if (searchFieldList.includes('name')) {
        fields.push('category_name LIKE ?');
        searchParams.push(`%${keyword}%`);
      }
      if (searchFieldList.includes('code')) {
        fields.push('category_code LIKE ?');
        searchParams.push(`%${keyword}%`);
      }

      if (fields.length) {
        searchWhereClauses.push(`(${fields.join(' OR ')})`);
        const searchWhereSql = searchWhereClauses.length 
          ? `WHERE ${searchWhereClauses.join(' AND ')}` 
          : '';

        // 查询所有匹配关键词的分类ID
        const [matchedCategories]: MySqlArrayResult<{ category_id: number }> = await pool.query(
          `SELECT category_id FROM categories ${searchWhereSql}`,
          searchParams
        );
        matchedCategoryIds = matchedCategories.map(item => item.category_id);
      }
    } else {
      // 无关键词时，所有分类都视为匹配
      matchedCategoryIds = allCategories.map(item => Number(item.category_id));
    }

    // 3. 找到所有匹配分类及其所有子分类的ID
    const allRelevantIds = this.findMatchedAndChildrenIds(
      allCategories,
      matchedCategoryIds
    );

    // 4. 筛选出需要返回的分类（匹配分类+其所有子分类）
    const relevantCategories = allCategories.filter(item => 
      allRelevantIds.includes(Number(item.category_id))
    );

    // 5. 处理树形结构或分页
    // 树形结构：从相关分类中构建树（支持按parent_id过滤根节点）
    const rootId = parent_id ?? 0;
    const treeData = buildCategoryTree(relevantCategories, rootId);
    return { list: treeData };
  }

  /**
   * 递归查找所有匹配分类及其所有子分类的ID
   * @param allCategories 所有分类
   * @param matchedIds 匹配搜索条件的分类ID
   * @returns 所有需要返回的分类ID（匹配分类+子分类）
   */
  private findMatchedAndChildrenIds(
    allCategories: Category[],
    matchedIds: number[]
  ): number[] {
    // 提前转换所有ID为number类型，避免重复转换
    const categoriesWithNumberIds = allCategories.map(item => ({
      ...item,
      category_id: Number(item.category_id),
      parent_id: Number(item.parent_id)
    }));

    // 构建父ID到子分类的映射
    const childrenMap = categoriesWithNumberIds.reduce<Record<number, number[]>>((map, item) => {
      if (!map[item.parent_id]) {
        map[item.parent_id] = [];
      }
      map[item.parent_id].push(item.category_id);
      return map;
    }, {});

    // 构建分类ID到父ID的映射
    const parentMap = categoriesWithNumberIds.reduce<Record<number, number>>((map, item) => {
      map[item.category_id] = item.parent_id;
      return map;
    }, {});

    // 递归收集所有相关分类ID
    const result = new Set<number>();
    
    // 收集子分类
    const collectChildren = (id: number) => {
      if (!result.has(id)) {
        result.add(id);
        (childrenMap[id] || []).forEach(childId => collectChildren(childId));
      }
    };

    // 收集父分类
    const collectParents = (id: number) => {
      const parentId = parentMap[id];
      if (parentId && parentId !== 0 && !result.has(parentId)) {
        result.add(parentId);
        collectParents(parentId);
      }
    };

    // 处理所有匹配的ID
    matchedIds.forEach(id => {
      collectChildren(id);
      collectParents(id);
    });

    return Array.from(result);
  }

  // 新增：添加子分类（支持一级分类，parent_id=0）
  async createCategory(data: CreateCategory, operatorId: bigint): Promise<Boolean> {
    const {
      parent_id,
      category_name,
      category_code,
      description,
      icon_url,
      sort_order = 0,
      status = CategoryStatus.Active,
      level
    } = data;

    // 验证：如果是子分类，父分类必须存在
    if (parent_id !== 0) {
      const [parent] = await pool.query<RowDataPacket[]>(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [parent_id]
      );
      if (parent.length === 0) {
        throw new Error('Parent category not found');
      }
    }

    // 验证：分类编码唯一（如果提供）
    if (category_code) {
      const [exists] = await pool.query<RowDataPacket[]>(
        'SELECT category_id FROM categories WHERE category_code = ?',
        [category_code]
      );
      if (exists.length > 0) {
        throw new Error('Category code already exists');
      }
    }

    // 插入新分类
    const [result] = await pool.query<RowDataPacket[]>(
      `INSERT INTO categories (
        parent_id, category_name, category_code, description, icon_url,
        sort_order, status, level, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parent_id, category_name, category_code || null, description || null, icon_url || null,
        sort_order, status, level, operatorId, operatorId
      ]
    );
    console.log('result', result)

    // 返回创建的分类详情
    // const [newCategory] = await pool.query<RowDataPacket[]>(
    //   'SELECT * FROM categories WHERE category_id = ?',
    //   [result.insertId]
    // );

    // return newCategory[0] as Category;
    return true;
  }

  // 新增：编辑分类
  async updateCategory(
    categoryId: number, 
    data: UpdateCategoryBody, 
    operatorId: bigint
  ): Promise<Category> {
    // 验证分类是否存在
    const [exists] = await pool.query<RowDataPacket[]>(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [categoryId]
    );
    if (exists.length === 0) {
      throw new Error('Category not found');
    }

    // 构建更新字段和参数
    const updateFields: string[] = [];
    const params: any[] = [];

    // if (data.parent_id !== undefined) {
    //   updateFields.push('parent_id = ?');
    //   params.push(data.parent_id);
    // }
    if (data.category_name !== undefined) {
      updateFields.push('category_name = ?');
      params.push(data.category_name);
    }
    if (data.category_code !== undefined) {
      // 验证编码唯一性（排除当前分类）
      const [codeExists] = await pool.query<RowDataPacket[]>(
        'SELECT category_id FROM categories WHERE category_code = ? AND category_id != ?',
        [data.category_code, categoryId]
      );
      if (codeExists.length > 0) {
        throw new Error('Category code already exists');
      }
      updateFields.push('category_code = ?');
      params.push(data.category_code);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }
    if (data.icon_url !== undefined) {
      updateFields.push('icon_url = ?');
      params.push(data.icon_url);
    }
    if (data.sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(data.sort_order);
    }
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    if (data.level !== undefined) {
      updateFields.push('level = ?');
      params.push(data.level);
    }

    // 必须更新最后操作人
    updateFields.push('updated_by = ?');
    params.push(operatorId);

    // 执行更新
    await pool.query(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE category_id = ?`,
      [...params, categoryId]
    );

    // 返回更新后的分类
    const [updatedCategory] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM categories WHERE category_id = ?',
      [categoryId]
    );

    return updatedCategory[0] as Category;
  }

  // 新增：删除分类（支持级联删除子分类或禁止删除）
  async deleteCategory(categoryId: number, cascade: boolean = false): Promise<boolean> {
    console.log('deleteCategory', categoryId, cascade)
    // 验证分类是否存在
    const [exists] = await pool.query<RowDataPacket[]>(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [categoryId]
    );
    if (exists.length === 0) {
      throw new Error('未找到类别');
    }

    // 检查是否有子分类
    const [children] = await pool.query<RowDataPacket[]>(
      'SELECT category_id FROM categories WHERE parent_id = ?',
      [categoryId]
    );

    if (children.length > 0 && !cascade) {
      // 无法删除有子类的类别。使用cascade=true删除所有子项。
      throw new Error('无法删除有子类的类别!');
    }

    // 级联删除：先删子分类，再删当前分类
    if (cascade && children.length > 0) {
      for (const child of children) {
        await this.deleteCategory(Number(child.category_id), true);
      }
    }

    // 删除当前分类（使用execute）
    const [result]: CommandResult = await pool.execute(
      'DELETE FROM categories WHERE category_id = ?',
      [categoryId]
    );

    // 正确获取affectedRows
    return result.affectedRows > 0;
  }
}

// 创建服务实例
export const categoryService = new CategoryService();