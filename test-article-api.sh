#!/bin/bash

# API测试脚本
BASE_URL=${API_BASE_URL:-"http://localhost:3000"}
API_PREFIX="/api"

echo "开始测试文章API..."
echo "服务器地址: $BASE_URL"
echo ""

# 检查服务器是否正在运行
echo "检查服务器连接..."
if command -v curl &> /dev/null; then
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" --max-time 5)
    if [[ $response_code -ge 200 && $response_code -lt 500 ]]; then
        echo "服务器连接成功"
        echo ""
    else
        echo "错误: 无法连接到服务器 $BASE_URL (HTTP状态码: $response_code)"
        echo "请确保服务器正在运行:"
        echo "1. 在一个终端窗口中运行: npm run dev"
        echo "2. 等待服务器启动完成"
        echo "3. 在另一个终端窗口中运行此测试脚本"
        echo ""
        exit 1
    fi
else
    echo "警告: 未找到curl命令，跳过服务器连接检查"
    echo ""
fi

# 1. 创建文章
echo "1. 创建文章..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/articles" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章标题",
    "subtitle": "测试文章副标题",
    "coverImageUrl": "http://example.com/cover.jpg",
    "content": "这是文章的正文内容，可以是HTML或Markdown格式。",
    "summary": "这是文章的摘要内容。",
    "authorId": 1,
    "status": "draft",
    "visibility": "public",
    "isFeatured": 0,
    "resourceUrl": "http://res.example.com/file.zip",
    "downloadPointThreshold": 0,
    "downloadFileUrl": "http://dl.example.com/file.pdf"
  }')

echo "创建文章响应:"
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# 检查创建是否成功
if echo "$CREATE_RESPONSE" | grep -q '"success":false' || echo "$CREATE_RESPONSE" | grep -q '"success": true'; then
    if echo "$CREATE_RESPONSE" | grep -q '"success":false'; then
        echo "创建文章失败，跳过后续测试"
        exit 1
    fi
fi

# 提取文章ID
ARTICLE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
if [ -z "$ARTICLE_ID" ]; then
  ARTICLE_ID=1
fi
echo "创建的文章ID: $ARTICLE_ID"
echo ""

# 2. 获取所有文章
echo "2. 获取所有文章..."
GET_ALL_RESPONSE=$(curl -s "$BASE_URL$API_PREFIX/articles?current=1&pageSize=10")
echo "获取所有文章响应:"
echo "$GET_ALL_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_ALL_RESPONSE"
echo ""

# 3. 根据ID获取文章
echo "3. 根据ID获取文章..."
GET_BY_ID_RESPONSE=$(curl -s "$BASE_URL$API_PREFIX/articles/$ARTICLE_ID")
echo "根据ID获取文章响应:"
echo "$GET_BY_ID_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_BY_ID_RESPONSE"
echo ""

# 4. 更新文章
echo "4. 更新文章..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL$API_PREFIX/articles/$ARTICLE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的文章标题",
    "subtitle": "更新后的文章副标题",
    "isFeatured": 1,
    "status": "published"
  }')
echo "更新文章响应:"
echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
echo ""

# 5. 根据状态获取文章
echo "5. 根据状态获取文章..."
GET_BY_STATUS_RESPONSE=$(curl -s "$BASE_URL$API_PREFIX/articles/status/published?current=1&pageSize=10")
echo "根据状态获取文章响应:"
echo "$GET_BY_STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_BY_STATUS_RESPONSE"
echo ""

# 6. 获取推荐文章
echo "6. 获取推荐文章..."
GET_FEATURED_RESPONSE=$(curl -s "$BASE_URL$API_PREFIX/articles/featured?current=1&pageSize=10")
echo "获取推荐文章响应:"
echo "$GET_FEATURED_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_FEATURED_RESPONSE"
echo ""

# 7. 删除文章
echo "7. 删除文章..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL$API_PREFIX/articles/$ARTICLE_ID")
echo "删除文章响应:"
echo "$DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
echo ""

echo "所有测试完成！"