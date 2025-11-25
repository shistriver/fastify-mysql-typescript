# 文章管理API文档

## API端点

所有文章相关的API都位于 `/api/articles` 路径下。

### 创建文章

**POST** `/api/articles`

创建一篇新文章。

#### 请求体
```json
{
  "title": "文章标题",
  "subtitle": "文章副标题",
  "coverImage": "封面图URL",
  "status": "draft|published|archived",
  "visibility": "public|private|member_only",
  "isRecommended": true|false,
  "summary": "文章摘要",
  "downloadPoints": 0,
  "resourceUrl": "资源地址"
}
```

#### 响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章标题",
    "subtitle": "文章副标题",
    "coverImage": "封面图URL",
    "status": "draft",
    "visibility": "public",
    "isRecommended": false,
    "summary": "文章摘要",
    "downloadPoints": 0,
    "resourceUrl": "资源地址",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 获取所有文章

**GET** `/api/articles?page=1&limit=10`

获取文章列表，支持分页。

#### 查询参数
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10

#### 响应
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### 根据ID获取文章

**GET** `/api/articles/:id`

根据ID获取特定文章。

#### 响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章标题",
    "subtitle": "文章副标题",
    "coverImage": "封面图URL",
    "status": "draft",
    "visibility": "public",
    "isRecommended": false,
    "summary": "文章摘要",
    "downloadPoints": 0,
    "resourceUrl": "资源地址",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 更新文章

**PUT** `/api/articles/:id`

更新指定ID的文章。

#### 请求体
```json
{
  "title": "更新后的文章标题",
  "subtitle": "更新后的文章副标题",
  // ... 其他需要更新的字段
}
```

#### 响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "更新后的文章标题",
    "subtitle": "更新后的文章副标题",
    "coverImage": "封面图URL",
    "status": "draft",
    "visibility": "public",
    "isRecommended": false,
    "summary": "文章摘要",
    "downloadPoints": 0,
    "resourceUrl": "资源地址",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 删除文章

**DELETE** `/api/articles/:id`

删除指定ID的文章。

#### 响应
```json
{
  "success": true,
  "message": "文章删除成功"
}
```

### 根据状态获取文章

**GET** `/api/articles/status/:status?page=1&limit=10`

根据文章状态获取文章列表。

#### 路径参数
- `status`: 文章状态 (draft|published|archived)

#### 查询参数
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10

#### 响应
```json
{
  "success": true,
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### 获取推荐文章

**GET** `/api/articles/recommended?page=1&limit=10`

获取推荐的文章列表。

#### 查询参数
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10

#### 响应
```json
{
  "success": true,
  "data": [...],
  "total": 20,
  "page": 1,
  "limit": 10
}
```