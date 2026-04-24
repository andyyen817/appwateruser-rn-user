const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DOWNLOADS_DIR = path.join(PUBLIC_DIR, 'downloads');

function parseVersionParts(filename) {
  const match = filename.match(/v(\d+(?:\.\d+)+)\.apk$/i);
  if (!match) {
    return [];
  }

  return match[1].split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersionParts(left, right) {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff = (right[index] || 0) - (left[index] || 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function getLatestAPK() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    return null;
  }

  const apkFiles = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((fileName) => /^ATMWater-User-v.+\.apk$/i.test(fileName))
    .sort((left, right) => compareVersionParts(parseVersionParts(left), parseVersionParts(right)));

  return apkFiles[0] || null;
}

function extractVersion(filename) {
  const match = filename.match(/v(\d+(?:\.\d+)*)\.apk$/i);
  return match ? match[1] : 'unknown';
}

function buildApkMeta(filename) {
  if (!filename) {
    return null;
  }

  const filePath = path.join(DOWNLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);

  return {
    app: 'ATMWater User App',
    version: extractVersion(filename),
    filename,
    size: stats.size,
    sizeFormatted: `${(stats.size / 1048576).toFixed(2)} MB`,
    updatedAt: stats.mtime.toISOString(),
    downloadUrl: '/download',
  };
}

app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${clientIp}`);
  next();
});

app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/download', (req, res) => {
  const latestAPK = getLatestAPK();

  if (!latestAPK) {
    return res.status(404).send('APK file not found');
  }

  const filePath = path.join(DOWNLOADS_DIR, latestAPK);
  return res.download(filePath, latestAPK);
});

app.get('/api/version', (req, res) => {
  const apkMeta = buildApkMeta(getLatestAPK());

  if (!apkMeta) {
    return res.status(404).json({
      success: false,
      message: 'No APK found',
      app: 'ATMWater User App',
    });
  }

  return res.json({
    success: true,
    ...apkMeta,
  });
});

app.get('/health', (req, res) => {
  const apkMeta = buildApkMeta(getLatestAPK());

  return res.json({
    app: 'ATMWater User App',
    status: 'ok',
    timestamp: new Date().toISOString(),
    available: Boolean(apkMeta),
    version: apkMeta?.version || 'N/A',
    filename: apkMeta?.filename || 'N/A',
    size: apkMeta?.sizeFormatted || 'N/A',
  });
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.use((error, req, res, next) => {
  console.error('[Distribution] Server error:', error);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  const apkMeta = buildApkMeta(getLatestAPK());

  console.log('========================================');
  console.log('ATMWater user distribution server started');
  console.log(`Port: ${PORT}`);
  console.log(`Latest APK: ${apkMeta?.filename || 'not found'}`);
  console.log(`Version: ${apkMeta?.version || 'N/A'}`);
  console.log('========================================');
});
