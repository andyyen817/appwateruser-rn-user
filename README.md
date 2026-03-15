# ATMWater 用户APP分发服务器

## 简介

这是ATMWater用户APP的独立分发服务器，用于提供用户APP的下载服务。

## 访问地址

- **Zeabur部署地址**: `https://atmwater-user-app.zeabur.app`
- **下载地址**: `https://atmwater-user-app.zeabur.app/download`

## 项目结构

```
.
├── package.json
├── server.js
├── zeabur.yaml
├── README.md
├── .gitignore
└── public/
    ├── index.html
    └── downloads/
        └── ATMWater-User-v0.4.apk
```

## 本地开发

```bash
npm install
npm run dev
```

服务将在 `http://localhost:8080` 启动

## Zeabur部署

1. 推送代码到GitHub仓库: `https://github.com/andyyen817/appwateruser-rn-user.git`
2. 在Zeabur Dashboard创建新项目
3. 选择GitHub部署，选择本仓库
4. 自动部署完成后即可访问

## Git操作

```bash
# 初始化仓库
git init
git remote add origin https://github.com/andyyen817/appwateruser-rn-user.git

# 提交代码
git add .
git commit -m "更新用户APP到v0.x"
git push -u origin main
```

## 更新APP版本

1. 构建新的APK文件
2. 将APK复制到 `public/downloads/` 目录
3. 更新 `server.js` 中的版本号
4. 提交并推送到GitHub
5. Zeabur会自动重新部署

## 接口说明

- `GET /` - 下载页面（含二维码）
- `GET /download` - 下载APK文件
- `GET /health` - 健康检查接口

---
**创建日期**: 2026-03-15  
**版本**: v1.0
