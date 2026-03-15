@echo off
chcp 65001
cls
echo ========================================
echo ATMWater 用户APP分发服务器 - Git初始化
echo ========================================
echo.

REM 检查Git是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未安装Git，请先安装Git
    pause
    exit /b 1
)

echo 步骤1: 初始化Git仓库...
git init

echo.
echo 步骤2: 添加远程仓库...
git remote add origin https://github.com/andyyen817/appwateruser-rn-user.git

echo.
echo 步骤3: 添加所有文件...
git add .

echo.
echo 步骤4: 提交初始代码...
git commit -m "Initial commit: 用户APP分发服务器 v1.0"

echo.
echo 步骤5: 推送到GitHub...
git push -u origin main

echo.
echo ========================================
echo Git初始化完成！
echo ========================================
echo 仓库地址: https://github.com/andyyen817/appwateruser-rn-user.git
echo.
echo 接下来:
echo 1. 在Zeabur Dashboard创建新项目
echo 2. 选择GitHub部署，选择本仓库
echo 3. 等待自动部署完成
echo.
pause
