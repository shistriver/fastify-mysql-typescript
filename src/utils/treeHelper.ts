import { Category, CategoryTreeNode } from '../types/category';

// 确保输入类型为正确的Category数组
export function buildCategoryTree(
  list: Category[],
  rootParentId: number = 0
): CategoryTreeNode[] {
  const groupByParentId = list.reduce<Record<number, Category[]>>((map, item) => {
    const parentId = Number(item.parent_id);
    if (!map[parentId]) {
      map[parentId] = [];
    }
    map[parentId].push(item);
    return map;
  }, {});

  const buildTree = (parentId: number): CategoryTreeNode[] => {
    const children = groupByParentId[parentId] || [];
    
    return children
      .sort((a, b) => b.sort_order - a.sort_order)
      .map<CategoryTreeNode>(item => {
        // 递归查找子分类
        const childNodes = buildTree(Number(item.category_id));
        
        // 只有存在子分类时才添加 children 字段
        if (childNodes.length > 0) {
          return {
            ...item,
            children: childNodes
          };
        } else {
          // 没有子分类时，返回不包含 children 的对象
          return { ...item };
        }
      });
  };

  return buildTree(rootParentId);
}