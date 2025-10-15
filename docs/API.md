# API 接口文档

密码学评测系统提供RESTful API接口，支持评测任务管理、证据文件处理、知识库查询等功能。

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

当前版本暂不需要认证，后续版本将添加JWT认证机制。

## 响应格式

所有API响应都遵循统一格式：

```json
{
    "success": true/false,
    "data": {},
    "error": "错误信息"
}
```

## 评测任务 API

### 1. 获取评测任务列表

```http
GET /api/evaluations
```

**响应示例**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
            "title": "SM4算法评测",
            "description": "对SM4算法实现进行安全性评测",
            "status": "completed",
            "created_at": "2024-01-01T10:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### 2. 创建评测任务

```http
POST /api/evaluations
```

**请求体**:
```json
{
    "title": "算法评测任务",
    "description": "详细描述"
}
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "id": 2,
        "uuid": "456e7890-e89b-12d3-a456-426614174001",
        "title": "算法评测任务",
        "status": "pending"
    }
}
```

### 3. 获取单个评测任务

```http
GET /api/evaluations/{id}
```

### 4. 开始处理评测任务

```http
POST /api/evaluations/{id}/process
```

## 证据文件 API

### 1. 上传证据文件

```http
POST /api/evaluations/{eval_id}/evidences
```

**请求类型**: `multipart/form-data`

**参数**:
- `file`: 文件对象

**响应示例**:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "filename": "test.pdf",
        "file_type": "application/pdf",
        "file_size": 1024
    }
}
```

### 2. 获取证据文件列表

```http
GET /api/evaluations/{eval_id}/evidences
```

### 3. 获取单个证据文件

```http
GET /api/evidences/{evidence_id}
```

### 4. 提取证据内容

```http
POST /api/evidences/{evidence_id}/extract
```

## 知识库 API

### 1. 知识库查询

```http
POST /api/knowledge/query
```

**请求体**:
```json
{
    "question": "SM4算法的特点是什么？"
}
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "question": "SM4算法的特点是什么？",
        "answer": "SM4是一种分组密码算法...",
        "sources": [
            {
                "title": "SM4算法标准",
                "source": "GMT 0002-2012"
            }
        ],
        "confidence": 0.85
    }
}
```

### 2. 知识库搜索

```http
POST /api/knowledge/search
```

**请求体**:
```json
{
    "query": "密码算法",
    "limit": 10
}
```

### 3. 生成测试题目

```http
POST /api/knowledge/generate-questions
```

**请求体**:
```json
{
    "topic": "对称密码",
    "difficulty": "medium",
    "count": 5
}
```

**响应示例**:
```json
{
    "success": true,
    "data": {
        "topic": "对称密码",
        "difficulty": "medium",
        "questions": [
            {
                "question": "SM4算法的分组长度是多少？",
                "options": {
                    "A": "64位",
                    "B": "128位",
                    "C": "192位",
                    "D": "256位"
                },
                "correct_answer": "B",
                "explanation": "SM4算法采用128位分组长度..."
            }
        ]
    }
}
```

## 错误代码

| 错误代码 | 说明 |
|---------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 状态码说明

### 评测任务状态
- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

### 报告状态
- `draft`: 草稿
- `reviewing`: 审核中
- `approved`: 已通过
- `rejected`: 已拒绝

## 使用示例

### Python 客户端示例

```python
import requests

# 创建评测任务
response = requests.post('http://localhost:5000/api/evaluations', json={
    'title': 'SM4算法测试',
    'description': '测试SM4算法实现'
})

if response.json()['success']:
    eval_id = response.json()['data']['id']
    print(f"评测任务创建成功，ID: {eval_id}")

# 上传证据文件
with open('evidence.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post(f'http://localhost:5000/api/evaluations/{eval_id}/evidences', files=files)
    
if response.json()['success']:
    print("文件上传成功")

# 知识库查询
response = requests.post('http://localhost:5000/api/knowledge/query', json={
    'question': 'SM4算法的安全强度如何？'
})

if response.json()['success']:
    answer = response.json()['data']['answer']
    print(f"回答: {answer}")
```

### JavaScript 客户端示例

```javascript
// 创建评测任务
async function createEvaluation() {
    const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'SM4算法测试',
            description: '测试SM4算法实现'
        })
    });
    
    const result = await response.json();
    if (result.success) {
        console.log('评测任务创建成功:', result.data.id);
        return result.data.id;
    }
}

// 知识库查询
async function queryKnowledge(question) {
    const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    });
    
    const result = await response.json();
    if (result.success) {
        return result.data.answer;
    }
}
```

## 注意事项

1. 文件上传大小限制为16MB
2. 支持的文件格式：PDF、Word文档、图片
3. API响应时间可能因为大模型调用而较长
4. 建议在生产环境中添加速率限制
5. 所有时间格式均为ISO 8601标准
