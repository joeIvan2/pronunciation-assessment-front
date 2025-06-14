// youdaoTest.js - Node.js 版本
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CryptoJS = require('crypto-js');

// 讀取金鑰設定
const keyPath = path.resolve(__dirname, '../config/youdao_api_key.json');
const { appKey, appSecret } = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const query = 'interpret';
const from = 'en';
const to = 'zh-CHS';
const salt = Date.now().toString();
const curtime = Math.round(Date.now() / 1000).toString();

function truncate(q) {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
}

const signStr = appKey + truncate(query) + salt + curtime + appSecret;
const sign = CryptoJS.SHA256(signStr).toString(CryptoJS.enc.Hex);

async function testYoudaoTranslate() {
  try {
    const res = await axios.post('https://openapi.youdao.com/api', null, {
      params: {
        q: query,
        appKey,
        salt,
        from,
        to,
        sign,
        signType: 'v3',
        curtime,
      },
    });
    console.log('完整回應:', res.data);
  } catch (err) {
    console.error('請求失敗:', err);
  }
}

testYoudaoTranslate(); 