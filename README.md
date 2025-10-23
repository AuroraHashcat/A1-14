# A1-14 商用密码测评辅助系统

## 简要说明

本项目基于大模型（LLM）与知识增强检索（RAG），构建自动化的商用密码测评辅助平台，支持证据多模态解析、知识检索增强推理、可控结构化LLM推理、规则化评分与结构化报告生成，具备自动化与人工复核的全流程质量保证能力，适用于研究、竞赛与产品化部署场景。

## 🚀 主要功能

- **证据处理**：批量上传、PDF/OCR解析与证据归一化。
- **知识检索（RAG）**：文档向量化、向量检索并为LLM拼接检索上下文。
- **LLM 集成**：统一的 LLM 客户端（`infrastructure/llm/llm_client.py`），支持结构化输出、容错解析与报告评审（`judge_evaluation`、`review_report`）。
- **报告生成**：自动生成结构化密评报告（单元评分、DAK判定、问题/建议、总体评价，总分<=100）。
- **评审与质量保证**：评审模块支持辅助评审（系统生成报告的内控）与独立评审（人工报告的自动化校验），输出结构化评审意见与修正建议。
- **题库服务**：基于知识库自动生成带解析的选择题（见 `app/services/knowledge_service.py`）。
- **测试与分析**：`test.py` 支持批量评测与结果分析（MAE、RMSE、Pearson、正确率等）。

## 🏗️ 项目结构（重点）

```
A1-14/                          # 项目根目录
├── app/                        # 应用层
│   ├── __init__.py            # 应用工厂
│   ├── models.py              # 数据模型定义
│   ├── api/                   # API接口
│   │   ├── __init__.py
│   │   ├── evaluation.py      # 评测任务API
│   │   ├── evidence.py        # 证据文件API
│   │   ├── knowledge.py       # 知识库API
│   │   ├── report.py          # 报告API
│   │   ├── auth.py            # 认证API
│   │   └── query.py           # 查询API
│   └── services/              # 业务服务层
│       ├── evaluation_service.py  # 评测服务
│       ├── evidence_service.py    # 证据处理服务
│       └── knowledge_service.py   # 知识库服务
├── infrastructure/            # 基础设施层
│   ├── __init__.py
│   ├── llm/                   # 大模型集成
│   │   ├── __init__.py
│   │   └── llm_client.py      # LLM客户端
│   └── vector_db/             # 向量数据库
│       ├── __init__.py
│       └── vector_store.py    # 向量存储
├── web/                       # Web界面层
│   ├── __init__.py
│   ├── routes.py              # 路由定义
│   ├── templates/             # HTML模板
│   │   ├── base.html          # 基础模板
│   │   ├── index.html         # 首页
│   │   └── knowledge.html     # 知识库页面
│   └── static/                # 静态资源
│       ├── css/main.css       # 样式文件
│       └── js/main.js         # JavaScript
├── config/                    # 配置模块
│   ├── __init__.py
│   └── config.py              # 配置类
├── scripts/                   # 工具脚本
│   ├── init_db.py             # 数据库初始化
│   └── init_vector_db.py      # 向量数据库初始化
├── docs/                      # 文档
│   ├── API.md                 # API文档
│   └── DEPLOYMENT.md          # 部署指南
├── data/                      # 数据目录
│   ├── uploads/               # 上传文件
│   └── chroma_db/             # 向量数据库文件
├── logs/                      # 日志目录
├── GMT 0010-2012.pdf          # GMT标准文档
├── requirements.txt           # Python依赖
├── .env.example               # 环境配置示例
├── .gitignore                # Git忽略文件
├── run.py                     # 应用启动文件
├── start.py                   # 便捷启动脚本
└── README.md                  # 项目说明
```

## 🚀 快速开始

### 方式一：使用便捷启动脚本（推荐）

```bash
# 1. 进入项目目录
cd A1-14

# 2. 运行启动脚本
python start.py
```

脚本会自动检查依赖、设置环境、初始化数据库并启动应用。

### 方式二：手动步骤

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 DEEPINFRA_API_KEY 等配置

# 3. 初始化数据库
python scripts/init_db.py

# 4. 初始化向量数据库
python scripts/init_vector_db.py

# 5. 启动应用
python run.py
```

### 访问系统

- **Web界面**: http://localhost:5000
- **API文档**: 参见 `docs/API.md`
- **默认用户**: admin/admin123

## 🎨 核心功能

### 📋 证据识别模块
- ✅ 支持多种文件格式（PDF、Word、图片）
- ✅ 智能OCR文字识别
- ✅ 自动内容提取和结构化
- ✅ 元数据信息提取

### 🤖 智能判定模块
- ✅ 基于GMT标准的合规性评估
- ✅ 自动化技术指标分析
- ✅ 安全风险识别和评估
- ✅ 智能评分和建议生成

### 📊 报告评审模块
- ✅ 自动化报告格式检查
- ✅ 内容完整性验证
- ✅ 技术标准符合性审核
- ✅ 专业评审报告生成

### 📚 知识库模块
- ✅ 基于GMT标准的智能问答
- ✅ 自然语言查询支持
- ✅ 相关文档推荐
- ✅ 自动题目生成功能

## 📈 系统特色

- **🧠 AI驱动**: 集成大语言模型，提供智能化分析
- **📖 标准为本**: 基于GMT国密标准，确保专业性
- **🔍 向量检索**: 高效的语义搜索和知识匹配
- **🎯 易于使用**: 直观的Web界面和完善的API
- **⚡ 高性能**: 优化的架构设计，支持并发处理
- **🛡️ 安全可靠**: 完善的错误处理和安全机制

## 🔧 开发指南

### API接口
完整的RESTful API，支持：
- 评测任务管理
- 证据文件上传和处理
- 知识库查询
- 报告生成和管理

详见 [`docs/API.md`](docs/API.md)

### 部署说明
支持多种部署方式：
- 开发环境快速部署
- Docker容器化部署
- 生产环境部署配置

详见 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### 扩展开发
- 模块化设计，易于扩展
- 标准的MVC架构
- 完善的错误处理机制
- 详细的代码注释

## 🤝 贡献指南

欢迎通过 issue 或 PR 贡献代码。请在提交前运行本地测试并遵循项目代码风格（PEP8）。

## 📄 许可证

上传前请根据组织要求添加合适许可证（如 MIT、Apache-2.0）。

## 📞 联系我们

如需协作或技术支持，请在仓库中提交 issue 或联系项目维护者。

---

**密码学评测系统** - 让密码学产品评测更智能、更高效！
