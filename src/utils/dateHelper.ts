// 1. 时间格式化核心函数
const formatDate = (input: Date | string): string => {
  // 处理无效输入
  if (!input) return '';
  
  // 统一转换为Date对象
  const date = input instanceof Date ? input : new Date(input);
  
  // 验证时间有效性
  if (isNaN(date.getTime())) return '';
  
  // 提取时间组件并补零
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // 拼接为 YYYY-MM-DD HH:mm:ss 格式
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 2. 递归处理对象中的所有时间字段
export const processDates = (data: any): any => {
  // 基本类型直接返回
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => processDates(item));
  }
  
  // 处理Date对象
  if (data instanceof Date) {
    return formatDate(data);
  }
  
  // 处理普通对象
  const result: Record<string, any> = {};
  for (const key in data) {
    // 处理时间字段（通常以_at结尾）
    if (key.endsWith('_at') && (data[key] instanceof Date || typeof data[key] === 'string')) {
      result[key] = formatDate(data[key]);
    } else {
      // 递归处理子对象
      result[key] = processDates(data[key]);
    }
  }
  return result;
};