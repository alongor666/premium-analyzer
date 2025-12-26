# 部署指南

本文档介绍如何部署保费收入多维度分析系统。

## 本地部署

### 前置要求

- Python 3.x 或 Node.js 16+
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）

### 方法1：使用 Python HTTP 服务器

1. 进入项目目录：
```bash
cd /Users/xuechenglong/Downloads/premium-analyzer
```

2. 启动服务器：
```bash
python3 -m http.server 8000
```

3. 访问应用：
```
http://localhost:8000
```

### 方法2：使用 Node.js HTTP 服务器

1. 安装 http-server：
```bash
npm install -g http-server
```

2. 启动服务器：
```bash
http-server -p 8000
```

3. 访问应用：
```
http://localhost:8000
```

---

## 生产部署

### 部署到 Vercel

Vercel 是一个零配置的静态网站部署平台。

#### 步骤：

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd premium-analyzer
vercel
```

4. **按提示操作**
- 设置项目名称
- 选择部署目录（根目录 `./`）
- 确认设置

5. **部署完成**
Vercel 会提供一个 `https://your-project.vercel.app` URL。

#### 更新部署

```bash
vercel --prod
```

---

### 部署到 Netlify

Netlify 是另一个流行的静态网站托管平台。

#### 方法1：通过网站拖拽部署

1. 访问 [netlify.com](https://www.netlify.com/)
2. 注册/登录账户
3. 将 `premium-analyzer` 文件夹拖拽到 Netlify 部署区域
4. 等待部署完成

#### 方法2：使用 Netlify CLI

1. **安装 Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **登录**
```bash
netlify login
```

3. **初始化并部署**
```bash
cd premium-analyzer
netlify init
netlify deploy --prod
```

---

### 部署到 GitHub Pages

GitHub Pages 提供免费的静态网站托管。

#### 步骤：

1. **创建 gh-pages 分支**
```bash
cd premium-analyzer
git checkout --orphan gh-pages
git add .
git commit -m "Initial deployment"
git push origin gh-pages
```

2. **在 GitHub 上启用 Pages**
- 进入仓库设置 (Settings)
- 找到 Pages 选项
- 选择 `gh-pages` 分支作为源
- 保存

3. **访问网站**
```
https://your-username.github.io/premium-analyzer/
```

---

### 部署到 Nginx

适用于有自己的服务器。

#### 步骤：

1. **安装 Nginx**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **配置 Nginx**

创建配置文件 `/etc/nginx/sites-available/premium-analyzer`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/premium-analyzer;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    # 缓存静态资源
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **启用站点**
```bash
sudo ln -s /etc/nginx/sites-available/premium-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **配置 HTTPS（推荐）**

使用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 部署到 Apache

#### 步骤：

1. **安装 Apache**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install apache2

# CentOS/RHEL
sudo yum install httpd
```

2. **配置虚拟主机**

创建配置文件 `/etc/apache2/sites-available/premium-analyzer.conf`：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/premium-analyzer

    <Directory /path/to/premium-analyzer>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # 启用重写规则
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # 启用压缩
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
    </IfModule>
</VirtualHost>
```

3. **启用站点**
```bash
sudo a2ensite premium-analyzer
sudo systemctl reload apache2
```

---

## Docker 部署

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM nginx:alpine

# 复制项目文件
COPY . /usr/share/nginx/html

# 复制 nginx 配置（可选）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

1. **构建镜像**
```bash
docker build -t premium-analyzer .
```

2. **运行容器**
```bash
docker run -d -p 8080:80 --name premium-analyzer premium-analyzer
```

3. **访问应用**
```
http://localhost:8080
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: always
```

启动：
```bash
docker-compose up -d
```

---

## 环境变量配置

创建 `.env` 文件（可选）：

```env
# 应用配置
APP_NAME=保费收入多维度分析系统
APP_VERSION=1.0.0

# API 配置（如果需要后端服务）
API_BASE_URL=http://localhost:3000

# 分析配置
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=csv,xlsx,xls
```

---

## 性能优化建议

### 1. 启用 CDN

将静态资源（JS, CSS, 图片）托管到 CDN：
- Cloudflare
- AWS CloudFront
- 阿里云 CDN

### 2. 资源压缩

- 使用 gzip/brotli 压缩
- 压缩图片
- 合并和最小化 CSS/JS

### 3. 缓存策略

在 `.htaccess` 或 nginx 配置中设置：

```nginx
# 浏览器缓存
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. 预加载关键资源

在 `index.html` 中添加：
```html
<link rel="preload" href="css/main.css" as="style">
<link rel="preload" href="js/app.js" as="script">
```

---

## 浏览器兼容性

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 90+ | 推荐 |
| Firefox | 88+ | 完全支持 |
| Safari | 14+ | 完全支持 |
| Edge | 90+ | 完全支持 |
| Opera | 76+ | 完全支持 |

**不支持：**
- Internet Explorer（任何版本）

---

## 安全建议

### 1. 内容安全策略 (CSP)

在 `<head>` 中添加：
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline';">
```

### 2. HTTPS

生产环境务必使用 HTTPS：
- Let's Encrypt（免费）
- 云服务商提供的证书

### 3. 文件上传限制

已在代码中限制：
- 最大文件大小：10MB
- 允许的格式：.csv, .xlsx, .xls

---

## 监控和日志

### 推荐工具

1. **前端监控**
   - Sentry（错误追踪）
   - Google Analytics（用户分析）

2. **性能监控**
   - Lighthouse CI
   - WebPageTest

3. **日志收集**
   - CloudWatch Logs（AWS）
   - Logtail（阿里云）

---

## 备份策略

1. **定期备份配置文件**
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz config/
```

2. **版本控制**
使用 Git 管理代码，保留历史版本。

---

## 故障排除

### 常见问题

**Q: 文件上传失败**
A: 检查文件大小是否超过10MB，格式是否正确。

**Q: 图表不显示**
A: 检查浏览器控制台错误，确认 ECharts 库已加载。

**Q: Worker 报错**
A: 确保 data.worker.js 路径正确，浏览器支持 Web Worker。

**Q: 导出功能不工作**
A: 检查 SheetJS 库是否加载，网络连接正常。

---

## 更新部署

### 更新流程

1. 修改代码
2. 测试功能
3. 提交到版本控制
4. 部署到生产环境

### 回滚策略

如果使用 Git：
```bash
git checkout <previous-version>
# 重新部署
```

如果使用 Vercel/Netlify，在控制台选择之前的部署版本即可。

---

## 支持

如有问题，请联系：
- 项目仓库：[GitHub Issues](https://github.com/your-repo/issues)
- 邮箱：support@example.com
