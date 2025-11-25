# API测试脚本
$BASE_URL = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://localhost:3000" }
$API_PREFIX = "/api"

Write-Host "开始测试文章API..."
Write-Host "服务器地址: $BASE_URL`n"

# 检查服务器是否正在运行
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL" -Method GET -TimeoutSec 5
    Write-Host "服务器连接成功`n"
} catch {
    Write-Host "错误: 无法连接到服务器 $BASE_URL" -ForegroundColor Red
    Write-Host "请确保服务器正在运行:" -ForegroundColor Yellow
    Write-Host "1. 在一个终端窗口中运行: npm run dev" -ForegroundColor Yellow
    Write-Host "2. 等待服务器启动完成" -ForegroundColor Yellow
    Write-Host "3. 在另一个终端窗口中运行此测试脚本`n" -ForegroundColor Yellow
    exit 1
}

# 1. 创建文章
Write-Host "1. 创建文章..."
$createData = @{
    title = "测试文章标题"
    subtitle = "测试文章副标题"
    coverImageUrl = "http://example.com/cover.jpg"
    content = "这是文章的正文内容，可以是HTML或Markdown格式。"
    summary = "这是文章的摘要内容。"
    authorId = 1
    status = "draft"
    visibility = "public"
    isFeatured = 1
    resourceUrl = "http://res.example.com/file.zip"
    downloadPointThreshold = 0
    downloadFileUrl = "http://dl.example.com/file.pdf"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles" -Method POST -Body $createData -ContentType "application/json"
    Write-Host "创建文章响应:"
    $createResponse | ConvertTo-Json -Depth 10
    Write-Host ""

    $articleId = 1
    if ($createResponse.data -and $createResponse.data.id) {
        $articleId = $createResponse.data.id
    }
    Write-Host "创建的文章ID: $articleId`n"
} catch {
    Write-Host "创建文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
    exit 1
}

# 2. 获取所有文章
Write-Host "2. 获取所有文章..."
try {
    $getAllResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles?current=1&pageSize=10" -Method GET
    Write-Host "获取所有文章响应:"
    $getAllResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "获取所有文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 2.1 根据标题过滤文章
Write-Host "2.1 根据标题过滤文章..."
try {
    $getByTitleResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles?current=1&pageSize=10&title=测试" -Method GET
    Write-Host "根据标题过滤文章响应:"
    $getByTitleResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "根据标题过滤文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 2.2 根据状态过滤文章
Write-Host "2.2 根据状态过滤文章..."
try {
    $getByStatusFilterResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles?current=1&pageSize=10&status=draft" -Method GET
    Write-Host "根据状态过滤文章响应:"
    $getByStatusFilterResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "根据状态过滤文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 3. 根据ID获取文章
Write-Host "3. 根据ID获取文章..."
try {
    $getByIdResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles/$articleId" -Method GET
    Write-Host "根据ID获取文章响应:"
    $getByIdResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "根据ID获取文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 4. 更新文章
Write-Host "4. 更新文章..."
$updateData = @{
    title = "更新后的文章标题"
    subtitle = "更新后的文章副标题"
    isFeatured =1
    status = "published"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles/$articleId" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "更新文章响应:"
    $updateResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "更新文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 5. 根据状态获取文章
Write-Host "5. 根据状态获取文章..."
try {
    $getByStatusResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles/status/published?current=1&pageSize=10" -Method GET
    Write-Host "根据状态获取文章响应:"
    $getByStatusResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "根据状态获取文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 6. 获取推荐文章
Write-Host "6. 获取推荐文章..."
try {
    $getFeaturedResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles/featured?current=1&pageSize=10" -Method GET
    Write-Host "获取推荐文章响应:"
    $getFeaturedResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "获取推荐文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# 7. 删除文章
Write-Host "7. 删除文章..."
try {
    $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL$API_PREFIX/articles/$articleId" -Method DELETE
    Write-Host "删除文章响应:"
    $deleteResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "删除文章失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

Write-Host "所有测试完成！"