# 部署指南

本文档介绍如何在不同环境中部署密码学评测系统。

## 环境要求

### 基础要求
- Python 3.8+
- 内存：至少4GB（推荐8GB+）
- 磁盘：至少10GB可用空间
- 网络：能够访问deepinfra API

### Python依赖
参见 `requirements.txt` 文件中的详细列表。

## 开发环境部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd crypto-evaluation-system
```

### 2. 创建虚拟环境
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. 安装依赖
```bash
pip install -r requirements.txt
```

### 4. 配置环境变量
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置文件，设置必要的参数
# 特别是 DEEPINFRA_API_KEY
```

### 5. 初始化数据库
```bash
python scripts/init_db.py
```

### 6. 初始化向量数据库
```bash
python scripts/init_vector_db.py
```

### 7. 启动应用
```bash
python run.py
```

或使用便捷启动脚本：
```bash
python start.py
```

## 生产环境部署

### 使用 Gunicorn (推荐)

1. 安装 Gunicorn
```bash
pip install gunicorn
```

2. 创建 Gunicorn 配置文件 `gunicorn.conf.py`
```python
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 300
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

3. 启动应用
```bash
gunicorn --config gunicorn.conf.py run:app
```

### 使用 uWSGI

1. 安装 uWSGI
```bash
pip install uwsgi
```

2. 创建配置文件 `uwsgi.ini`
```ini
[uwsgi]
module = run:app
master = true
processes = 4
threads = 2
socket = /tmp/crypto-eval.sock
chmod-socket = 666
vacuum = true
die-on-term = true
```

3. 启动应用
```bash
uwsgi --ini uwsgi.ini
```

## 容器化部署

### Docker 部署

1. 创建 Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-chi-sim \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p data/uploads data/chroma_db logs

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
```

2. 构建镜像
```bash
docker build -t crypto-eval-system .
```

3. 运行容器
```bash
docker run -d \
  --name crypto-eval \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  crypto-eval-system
```

### Docker Compose 部署

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env
    environment:
      - FLASK_ENV=production
    depends_on:
      - redis
      - postgres

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: crypto_eval
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
```

启动服务：
```bash
docker-compose up -d
```

## 反向代理配置

### Nginx 配置

创建 `/etc/nginx/sites-available/crypto-eval`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /static {
        alias /path/to/crypto-eval-system/web/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/crypto-eval /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache 配置

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
    
    <Location "/">
        ProxyPassReverse /
        ProxyPassReverseMapping /
    </Location>
</VirtualHost>
```

## SSL/TLS 配置

### 使用 Let's Encrypt
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 数据库配置

### PostgreSQL (推荐生产环境)

1. 安装 PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
```

2. 创建数据库和用户
```sql
CREATE DATABASE crypto_eval;
CREATE USER crypto_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE crypto_eval TO crypto_user;
```

3. 更新环境配置
```bash
DATABASE_URL=postgresql://crypto_user:secure_password@localhost/crypto_eval
```

### MySQL/MariaDB

```sql
CREATE DATABASE crypto_eval;
CREATE USER 'crypto_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON crypto_eval.* TO 'crypto_user'@'localhost';
FLUSH PRIVILEGES;
```

环境配置：
```bash
DATABASE_URL=mysql://crypto_user:secure_password@localhost/crypto_eval
```

## 监控和日志

### 日志配置

在生产环境中，建议使用 rsyslog 或 journald 管理日志：

```python
# 在配置文件中添加
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler('logs/crypto-eval.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
```

### 性能监控

推荐使用以下工具进行监控：

1. **Prometheus + Grafana**
```bash
# 安装 prometheus_flask_exporter
pip install prometheus_flask_exporter
```

2. **新版Relic** 或 **DataDog** 进行APM监控

3. **Sentry** 进行错误追踪
```bash
pip install sentry-sdk[flask]
```

## 备份策略

### 数据库备份
```bash
#!/bin/bash
# backup_db.sh

BACKUP_DIR="/backup/crypto-eval"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL 备份
pg_dump crypto_eval > "$BACKUP_DIR/db_backup_$DATE.sql"

# 压缩备份文件
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### 文件备份
```bash
#!/bin/bash
# backup_files.sh

rsync -av --delete /path/to/crypto-eval/data/ /backup/crypto-eval/data/
```

设置定时任务：
```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup_db.sh
0 3 * * * /path/to/backup_files.sh
```

## 安全配置

### 防火墙设置
```bash
# 只允许必要的端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 应用安全
1. 定期更新依赖包
2. 使用强密钥和密码
3. 启用HTTPS
4. 配置安全头部
5. 限制文件上传大小和类型

### 系统安全
1. 及时安装安全更新
2. 使用非root用户运行应用
3. 配置适当的文件权限
4. 启用日志审计

## 故障排除

### 常见问题

1. **内存不足**
   - 增加系统内存
   - 优化向量数据库配置
   - 调整Worker进程数

2. **磁盘空间不足**
   - 清理日志文件
   - 压缩旧数据
   - 增加存储空间

3. **API调用超时**
   - 检查网络连接
   - 验证API密钥
   - 增加超时时间

4. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接字符串
   - 检查防火墙设置

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看系统日志
journalctl -u crypto-eval -f

# 查看nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 性能优化

1. **数据库优化**
   - 添加适当的索引
   - 优化查询语句
   - 使用连接池

2. **缓存策略**
   - 使用Redis缓存查询结果
   - 静态文件CDN加速

3. **资源优化**
   - 压缩静态文件
   - 优化图片大小
   - 使用异步处理

记住在部署前充分测试所有功能，确保系统稳定运行。
