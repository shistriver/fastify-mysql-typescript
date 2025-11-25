# 文章API测试指南

## 启动服务器

在运行测试之前，请确保服务器正在运行：

```bash
npm run dev
```

等待服务器启动完成，应该会显示"服务器运行在 http://localhost:3000"。

## 运行测试

### 方法1：使用Node.js测试脚本（推荐）

```bash
npm run test:articles
```

### 方法2：使用PowerShell脚本（Windows）

```powershell
.\test-article-api.ps1
```

### 方法3：使用Bash脚本（Linux/Mac）

```bash
./test-article-api.sh
```

## 自定义服务器地址

如果服务器运行在不同的地址或端口上，可以通过环境变量设置：

### Node.js测试

```bash
# Windows (PowerShell)
$env:API_BASE_URL="http://your-server:port"
npm run test:articles

# Windows (CMD)
set API_BASE_URL=http://your-server:port && npm run test:articles

# Linux/Mac
API_BASE_URL=http://your-server:port npm run test:articles
```

### PowerShell脚本

```powershell
$env:API_BASE_URL="http://your-server:port"
.\test-article-api.ps1
```

### Bash脚本

```bash
export API_BASE_URL=http://your-server:port
./test-article-api.sh
```

## 测试内容

测试脚本将执行以下操作：

1. 创建一篇新文章
2. 获取所有文章列表
3. 根据ID获取特定文章
4. 更新文章信息
5. 根据状态获取文章
6. 获取推荐文章
7. 删除文章

## 常见问题

### 连接被拒绝错误

如果出现"ECONNREFUSED"错误，请检查：

1. 服务器是否正在运行
2. 服务器地址和端口是否正确
3. 防火墙是否阻止了连接

### 测试失败

如果某些测试失败，请检查：

1. 数据库连接是否正常
2. 文章表是否已创建
3. API端点是否正确实现