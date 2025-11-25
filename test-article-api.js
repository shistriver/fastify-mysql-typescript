const http = require('http');
const https = require('https');
const url = require('url');

// 配置基础URL - 从环境变量获取或使用默认值
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// 发送HTTP请求的辅助函数
function sendRequest(options, data) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${BASE_URL}${API_PREFIX}${options.path}`);
    
    // 根据协议选择http或https模块
    const client = fullUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      path: fullUrl.pathname + fullUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试文章API
async function testArticleAPI() {
  try {
    console.log('开始测试文章API...');
    console.log(`服务器地址: ${BASE_URL}\n`);

    // 1. 创建文章
    console.log('1. 创建文章...');
    const createResponse = await sendRequest({
      path: '/articles',
      method: 'POST'
    }, {
      title: '测试文章标题',
      subtitle: '测试文章副标题',
      coverImageUrl: 'http://example.com/cover.jpg',
      content: '这是文章的正文内容，可以是HTML或Markdown格式。',
      summary: '这是文章的摘要内容。',
      authorId: 1,
      status: 'draft',
      visibility: 'public',
      isFeatured: 1,
      pointThreshold: 0,
      resourceUrl: 'http://res.example.com/file.zip',
      downloadPointThreshold: 0,
      downloadFileUrl: 'http://dl.example.com/file.pdf'
    });
    
    console.log('创建文章响应:', JSON.stringify(createResponse, null, 2));
    
    // 检查创建是否成功
    if (createResponse.status !== 201 || !createResponse.data.success) {
      console.log('创建文章失败，跳过后续测试');
      return;
    }
    
    const articleId = createResponse.data.data?.id || 1;
    console.log('创建的文章ID:', articleId, '\n');

    // 2. 获取所有文章
    console.log('2. 获取所有文章...');
    const getAllResponse = await sendRequest({
      path: '/articles?current=1&pageSize=10',
      method: 'GET'
    });
    console.log('获取所有文章响应:', JSON.stringify(getAllResponse, null, 2), '\n');

    // 2.1 根据标题过滤文章
    console.log('2.1 根据标题过滤文章...');
    const getByTitleResponse = await sendRequest({
      path: '/articles?current=1&pageSize=10&title=测试',
      method: 'GET'
    });
    console.log('根据标题过滤文章响应:', JSON.stringify(getByTitleResponse, null, 2), '\n');

    // 2.2 根据状态过滤文章
    console.log('2.2 根据状态过滤文章...');
    const getByStatusFilterResponse = await sendRequest({
      path: '/articles?current=1&pageSize=10&status=draft',
      method: 'GET'
    });
    console.log('根据状态过滤文章响应:', JSON.stringify(getByStatusFilterResponse, null, 2), '\n');

    // 3. 根据ID获取文章
    console.log('3. 根据ID获取文章...');
    const getByIdResponse = await sendRequest({
      path: `/articles/${articleId}`,
      method: 'GET'
    });
    console.log('根据ID获取文章响应:', JSON.stringify(getByIdResponse, null, 2), '\n');

    // 4. 更新文章
    console.log('4. 更新文章...');
    const updateResponse = await sendRequest({
      path: `/articles/${articleId}`,
      method: 'PUT'
    }, {
      title: '更新后的文章标题',
      subtitle: '更新后的文章副标题',
      isFeatured: 0,
      status: 'published'
    });
    console.log('更新文章响应:', JSON.stringify(updateResponse, null, 2), '\n');

    // 5. 根据状态获取文章
    console.log('5. 根据状态获取文章...');
    const getByStatusResponse = await sendRequest({
      path: '/articles/status/published?page=1&limit=10',
      method: 'GET'
    });
    console.log('根据状态获取文章响应:', JSON.stringify(getByStatusResponse, null, 2), '\n');

    // 6. 获取推荐文章
    console.log('6. 获取推荐文章...');
    const getFeaturedResponse = await sendRequest({
      path: '/articles/featured?page=1&limit=10',
      method: 'GET'
    });
    console.log('获取推荐文章响应:', JSON.stringify(getFeaturedResponse, null, 2), '\n');

    // 7. 删除文章
    console.log('7. 删除文章...');
    const deleteResponse = await sendRequest({
      path: `/articles/${articleId}`,
      method: 'DELETE'
    });
    console.log('删除文章响应:', JSON.stringify(deleteResponse, null, 2), '\n');

    console.log('所有测试完成！');
  } catch (error) {
    console.error('API调用错误:', error.message || error);
    console.log('\n请确保服务器正在运行:');
    console.log('1. 在一个终端窗口中运行: npm run dev');
    console.log('2. 等待服务器启动完成');
    console.log('3. 在另一个终端窗口中运行: npm run test:articles');
  }
}

// 运行测试
testArticleAPI();