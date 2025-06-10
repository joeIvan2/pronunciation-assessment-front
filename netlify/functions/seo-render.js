const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDJqJ8C5wQQxQx5x5x5x5x5x5x5x5x5x5x",
  authDomain: "nicetone.firebaseapp.com",
  projectId: "nicetone",
  storageBucket: "nicetone.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// 初始化 Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase 初始化失敗:', error);
}

// 生成SEO優化的HTML
function generateSEOHTML(shareData, hashId, baseUrl) {
  const { favorites = [], tags = [] } = shareData || {};
  // 僅取前10個句子和標籤以減少頁面體積
  const sentences = favorites
    .map(fav => fav.text)
    .filter(text => text && text.length > 0)
    .slice(0, 10);
  const tagNames = tags
    .map(tag => tag.name)
    .filter(name => name)
    .slice(0, 10);
  
  // 生成標題和描述
  const title = sentences.length > 0
    ? `英語發音練習：${sentences[0].substring(0, 50)}${sentences[0].length > 50 ? '...' : ''} - NiceTone`
    : `英語發音練習集 (${hashId}) - NiceTone`;
    
  const description = sentences.length > 0
    ? `這個英語發音練習集包含 ${sentences.length} 個句子${
        tagNames.length > 0 ? `，涵蓋 ${tagNames.slice(0, 3).join('、')} 等主題` : ''
      }。使用AI技術進行發音評估，幫助您提升英語口語能力。`
    : `英語發音練習集，使用AI技術進行專業的發音評估和指導。`;
  
  const keywords = ['英語發音', '發音練習', '語音評估', 'AI評分', '英語學習', '口語練習', ...tagNames].join(', ');
  
  // 結構化數據
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalResource",
    "name": title,
    "description": description,
    "url": `${baseUrl}/?hash=${hashId}`,
    "educationalLevel": "intermediate",
    "learningResourceType": "practice exercise",
    "inLanguage": "en",
    "about": {
      "@type": "Thing",
      "name": "English Pronunciation",
      "description": "英語發音練習和評估"
    },
    "teaches": ["英語發音", "語音評估"],
    "text": sentences.slice(0, 10), // 只包含前10個句子避免過大
    "keywords": keywords.split(', '),
    "publisher": {
      "@type": "Organization",
      "name": "NiceTone",
      "url": baseUrl
    },
    "dateCreated": new Date().toISOString(),
    "interactivityType": "active",
    "educationalUse": "practice",
    "typicalAgeRange": "13-99"
  };

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.webp" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    
    <!-- SEO Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <meta name="author" content="NiceTone" />
    
    <!-- Open Graph Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${baseUrl}/favicon.webp" />
    <meta property="og:url" content="${baseUrl}/?hash=${hashId}" />
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${baseUrl}/favicon.webp" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${baseUrl}/?hash=${hashId}" />
    
    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
    </script>
    
    <!-- 重定向到主應用 -->
    <script>
      // 如果不是搜索引擎爬蟲，重定向到主應用
      if (!/bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i.test(navigator.userAgent)) {
        window.location.href = '/?hash=${hashId}';
      }
    </script>
    
    <!-- CSS -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #ffffff;
        }
        h1, h2 { color: #007AFF; }
        .practice-button {
            display: inline-block;
            background: #007AFF;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 10px 0;
        }
        ul, ol { padding-left: 20px; }
        li { margin: 8px 0; }
        .sentence-list { max-height: 400px; overflow-y: auto; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        footer a { color: #007AFF; text-decoration: none; }
    </style>
</head>
<body>
    <!-- 搜索引擎可見的內容 -->
    <header>
        <h1>${title}</h1>
        <p>${description}</p>
    </header>
    
    <main>
        ${tagNames.length > 0 ? `
        <section>
            <h2>練習標籤 (前10個)</h2>
            <ul>
                ${tagNames.map(tag => `<li>${tag}</li>`).join('')}
            </ul>
        </section>
        ` : ''}
        
        <section>
            <h2>練習句子 (前10個)</h2>
            ${sentences.length > 0 ? `
            <div class="sentence-list">
                <ol>
                    ${sentences.map(sentence => `<li>${sentence}</li>`).join('')}
                </ol>
            </div>
            ` : '<p>暫無練習句子</p>'}
        </section>
        
        <section>
            <h2>開始練習</h2>
            <p>
                <a href="/?hash=${hashId}" class="practice-button">
                    🎯 開始發音練習
                </a>
            </p>
            <p>使用AI技術進行專業的英語發音評估，即時獲得評分和改進建議。</p>
        </section>
    </main>
    
    <footer>
        <p>© NiceTone - AI 驅動的英語發音評估工具</p>
        <p>
            <a href="/">返回首頁</a> | 
            <a href="/?hash=${hashId}">互動式練習</a>
        </p>
    </footer>
    
    <!-- 用於實際應用載入的連結 -->
    <noscript>
        <p>本頁面需要JavaScript來提供完整的互動體驗。</p>
        <p><a href="/?hash=${hashId}">點擊這裡載入完整應用</a></p>
    </noscript>
</body>
</html>`;
}

// 主要處理函數
exports.handler = async (event, context) => {
  const { queryStringParameters } = event;
  const hashId = queryStringParameters?.hash;
  
  if (!hashId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing hash parameter' })
    };
  }
  
  try {
    // 從 Firebase 載入分享數據
    let shareData = null;
    
    if (db) {
      try {
        const docRef = doc(db, 'shares', hashId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          shareData = docSnap.data();
        }
      } catch (firebaseError) {
        console.error('Firebase 查詢失敗:', firebaseError);
        // 繼續執行，使用默認數據
      }
    }
    
    // 如果沒有找到數據，使用默認數據
    if (!shareData) {
      shareData = {
        favorites: [
          { text: 'Hello, how are you today?' },
          { text: 'Nice to meet you.' },
          { text: 'Have a great day!' }
        ],
        tags: [
          { name: '日常對話' }
        ]
      };
    }
    
    const baseUrl = 'https://nicetone.ai';
    const html = generateSEOHTML(shareData, hashId, baseUrl);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // 緩存1小時
      },
      body: html
    };
    
  } catch (error) {
    console.error('SEO 渲染失敗:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}; 