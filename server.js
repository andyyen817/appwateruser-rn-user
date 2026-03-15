const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP}`);
    next();
});

// 静态文件服务
app.use(express.static('public'));

// APK下载
app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'public/downloads/ATMWater-User-v0.4.apk');
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(`[下载请求] 用户APP下载请求 - IP: ${clientIP}`);

    if (!fs.existsSync(filePath)) {
        console.error(`[错误] APK文件不存在: ${filePath}`);
        return res.status(404).send('用户APP文件未找到');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const fileSizeMB = (fileSize / 1048576).toFixed(2);

    console.log(`[下载开始] 用户APP - 文件大小: ${fileSizeMB} MB - IP: ${clientIP}`);

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename=ATMWater-User.apk');
    res.setHeader('Content-Length', fileSize);

    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (err) => {
        console.error(`[错误] 文件流读取失败: ${err.message}`);
        res.status(500).send('文件读取失败');
    });

    fileStream.on('end', () => {
        console.log(`[下载完成] 用户APP下载成功 - IP: ${clientIP}`);
    });

    fileStream.pipe(res);
});

// 健康检查
app.get('/health', (req, res) => {
    const apkPath = path.join(__dirname, 'public/downloads/ATMWater-User-v0.4.apk');
    const apkExists = fs.existsSync(apkPath);

    const healthData = {
        app: 'ATMWater User App',
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: 'v0.4',
        available: apkExists,
        size: apkExists ? `${(fs.statSync(apkPath).size / 1048576).toFixed(2)} MB` : 'N/A'
    };

    console.log(`[健康检查] 状态: ${healthData.status}, 文件存在: ${apkExists}`);
    res.json(healthData);
});

// 404 处理
app.use((req, res) => {
    console.warn(`[404] 未找到路径: ${req.method} ${req.url}`);
    res.status(404).send('页面未找到');
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(`[服务器错误] ${err.stack}`);
    res.status(500).send('服务器内部错误');
});

app.listen(PORT, () => {
    const apkPath = path.join(__dirname, 'public/downloads/ATMWater-User-v0.4.apk');
    const apkExists = fs.existsSync(apkPath);

    console.log('========================================');
    console.log('  ATMWater 用户APP分发服务器启动成功');
    console.log('========================================');
    console.log(`服务端口: ${PORT}`);
    console.log(`环境变量 PORT: ${process.env.PORT || '未设置'}`);
    console.log('');
    console.log('用户APP (v0.4):');
    console.log(`   状态: ${apkExists ? '存在' : '不存在'}`);
    if (apkExists) {
        const stat = fs.statSync(apkPath);
        console.log(`   大小: ${(stat.size / 1048576).toFixed(2)} MB`);
    }
    console.log('');
    console.log('公网访问: https://atmwater-user-app.zeabur.app');
    console.log('下载地址: https://atmwater-user-app.zeabur.app/download');
    console.log('========================================');
});
