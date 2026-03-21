const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

// 获取最新版本的APK
function getLatestAPK() {
    const downloadsDir = path.join(__dirname, 'public/downloads');

    if (!fs.existsSync(downloadsDir)) {
        return null;
    }

    const files = fs.readdirSync(downloadsDir);
    const apkFiles = files.filter(f => f.startsWith('ATMWater-User-') && f.endsWith('.apk'));

    if (apkFiles.length === 0) {
        return null;
    }

    // 按版本号数值排序，获取最新版本
    apkFiles.sort((a, b) => {
        const va = a.match(/v(\d+)\.(\d+)/);
        const vb = b.match(/v(\d+)\.(\d+)/);
        if (!va || !vb) return 0;
        const major = parseInt(vb[1]) - parseInt(va[1]);
        return major !== 0 ? major : parseInt(vb[2]) - parseInt(va[2]);
    });
    return apkFiles[0];
}

// 从文件名提取版本号
function extractVersion(filename) {
    const versionMatch = filename.match(/v(\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : 'unknown';
}

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP}`);
    next();
});

// 静态文件服务
app.use(express.static('public'));

// APK下载 - 自动检测最新版本
app.get('/download', (req, res) => {
    const latestAPK = getLatestAPK();
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(`[下载请求] 用户APP下载请求 - IP: ${clientIP}`);

    if (!latestAPK) {
        console.error(`[错误] 未找到APK文件`);
        return res.status(404).send('用户APP文件未找到');
    }

    const filePath = path.join(__dirname, 'public/downloads', latestAPK);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const fileSizeMB = (fileSize / 1048576).toFixed(2);

    console.log(`[下载开始] ${latestAPK} - 文件大小: ${fileSizeMB} MB - IP: ${clientIP}`);

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename=${latestAPK}`);
    res.setHeader('Content-Length', fileSize);

    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (err) => {
        console.error(`[错误] 文件流读取失败: ${err.message}`);
        res.status(500).send('文件读取失败');
    });

    fileStream.on('end', () => {
        console.log(`[下载完成] ${latestAPK} 下载成功 - IP: ${clientIP}`);
    });

    fileStream.pipe(res);
});

// 版本信息API
app.get('/api/version', (req, res) => {
    const latestAPK = getLatestAPK();

    if (!latestAPK) {
        return res.status(404).json({
            error: 'No APK found',
            app: 'ATMWater User App'
        });
    }

    const version = extractVersion(latestAPK);
    const filePath = path.join(__dirname, 'public/downloads', latestAPK);
    const stats = fs.statSync(filePath);

    const versionInfo = {
        app: 'ATMWater User App',
        version: version,
        filename: latestAPK,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1048576).toFixed(2)} MB`,
        updatedAt: stats.mtime,
        downloadUrl: '/download'
    };

    console.log(`[版本查询] 当前版本: v${version}`);
    res.json(versionInfo);
});

// 健康检查
app.get('/health', (req, res) => {
    const latestAPK = getLatestAPK();
    const apkExists = latestAPK !== null;

    const healthData = {
        app: 'ATMWater User App',
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: apkExists ? extractVersion(latestAPK) : 'N/A',
        available: apkExists,
        filename: apkExists ? latestAPK : 'N/A',
        size: apkExists ? `${(fs.statSync(path.join(__dirname, 'public/downloads', latestAPK)).size / 1048576).toFixed(2)} MB` : 'N/A'
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

// 启动服务器
app.listen(PORT, () => {
    const latestAPK = getLatestAPK();
    const apkExists = latestAPK !== null;

    console.log('========================================');
    console.log('  ATMWater 用户APP分发服务器启动成功');
    console.log('========================================');
    console.log(`服务端口: ${PORT}`);
    console.log(`环境变量 PORT: ${process.env.PORT || '未设置'}`);
    console.log('');
    console.log('用户APP:');
    console.log(`   状态: ${apkExists ? '存在' : '不存在'}`);
    if (apkExists) {
        const version = extractVersion(latestAPK);
        const stat = fs.statSync(path.join(__dirname, 'public/downloads', latestAPK));
        console.log(`   版本: v${version}`);
        console.log(`   文件: ${latestAPK}`);
        console.log(`   大小: ${(stat.size / 1048576).toFixed(2)} MB`);
    }
    console.log('');
    console.log('公网访问: https://atmwater-user-app.zeabur.app');
    console.log('下载地址: https://atmwater-user-app.zeabur.app/download');
    console.log('版本信息: https://atmwater-user-app.zeabur.app/api/version');
    console.log('========================================');
});
