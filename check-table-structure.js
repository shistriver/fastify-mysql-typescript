const { pool } = require('./src/db/mysql');

async function checkTableStructure() {
  try {
    // 检查表是否存在
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'articles'"
    );
    
    if (tables.length === 0) {
      console.log('错误: articles 表不存在');
      console.log('请先运行数据库迁移命令:');
      console.log('npm run migrate:articles');
      return;
    }
    
    // 获取表结构
    const [columns] = await pool.execute(
      "DESCRIBE articles"
    );
    
    console.log('articles 表结构:');
    console.log('-------------------');
    columns.forEach(column => {
      console.log(`${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    console.log('\n检查字段长度限制:');
    
    // 检查 resource_url 字段长度
    const resourceUrlColumn = columns.find(col => col.Field === 'resource_url');
    if (resourceUrlColumn) {
      console.log(`resource_url 字段定义: ${resourceUrlColumn.Type}`);
    }
    
    const coverImageUrlColumn = columns.find(col => col.Field === 'cover_image_url');
    if (coverImageUrlColumn) {
      console.log(`cover_image_url 字段定义: ${coverImageUrlColumn.Type}`);
    }
    
  } catch (error) {
    console.error('检查表结构时出错:', error.message);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

checkTableStructure();