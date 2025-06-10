const fs = require('fs');
const path = require('path');

// 模擬的分享數據 API 調用 (實際應該連接到 Firebase)
async function loadShareData(hashId) {
  // 這裡應該實際調用 Firebase API 來獲取數據
  // 為了示例，我們返回一些模擬數據
  try {
    // 實際實現時，這裡應該連接到 Firebase 並獲取真實數據
    console.log(`載入分享數據: ${hashId}`);
    
    return {
      success: true,
      data: {
        favorites: [
          { id: '1', text: 'Hello, how are you?', tagIds: ['1'] },
          { id: '2', text: 'Nice to meet you.', tagIds: ['1'] }
        ],
        tags: [
          { tagId: '1', name: '日常對話', color: '#007AFF' }
        ]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 生成SEO優化的HTML
function generateSEOHTML(shareData, hashId) {
  const { favorites, tags } = shareData;
  const sentences = favorites.map(fav => fav.text);
  const tagNames = tags.map(tag => tag.name);
  
  // 生成標題和描述
  const title = sentences.length > 0
    ? `英語發音練習：${sentences[0].substring(0, 50)}... - NiceTone`
    : `英語發音練習集 (${hashId}) - NiceTone`;
    
  const description = `這個英語發音練習集包含 ${sentences.length} 個句子${
    tagNames.length > 0 ? `，涵蓋 ${tagNames.join('、')} 等主題` : ''
  }。使用AI技術進行發音評估，幫助您提升英語口語能力。`;
  
  const keywords = ['英語發音', '發音練習', '語音評估', 'AI評分', '英語學習', '口語練習', ...tagNames].join(', ');
  
  // 結構化數據
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalResource",
    "name": title,
    "description": description,
    "educationalLevel": "intermediate",
    "learningResourceType": "practice exercise",
    "inLanguage": "en",
    "about": {
      "@type": "Thing",
      "name": "English Pronunciation",
      "description": "英語發音練習和評估"
    },
    "teaches": ["英語發音", "語音評估"],
    "text": sentences,
    "keywords": keywords.split(', '),
    "publisher": {
      "@type": "Organization",
      "name": "NiceTone"
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
    <meta property="og:image" content="/favicon.webp" />
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="/favicon.webp" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="/?hash=${hashId}" />
    
    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
    </script>
    
    <!-- Redirect to main app for real users -->
    <script>
      // 如果不是搜索引擎爬蟲，重定向到主應用
      if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
        window.location.href = '/?hash=${hashId}';
      }
    </script>
</head>
<body>
    <!-- 搜索引擎可見的內容 -->
    <div id="seo-content">
        <header>
            <h1>${title}</h1>
            <p>${description}</p>
        </header>
        
        <main>
            <section>
                <h2>練習標籤</h2>
                <ul>
                    ${tagNames.map(tag => `<li>${tag}</li>`).join('')}
                </ul>
            </section>
            
            <section>
                <h2>練習句子 (${sentences.length} 個)</h2>
                <ol>
                    ${sentences.map(sentence => `<li>${sentence}</li>`).join('')}
                </ol>
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
    </div>
    
    <!-- CSS for basic styling -->
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
        }
        ul, ol { padding-left: 20px; }
        li { margin: 8px 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        footer a { color: #007AFF; text-decoration: none; }
    </style>
    
    <!-- 用於實際應用載入的連結 -->
    <noscript>
        <p>本頁面需要JavaScript來提供完整的互動體驗。</p>
        <p><a href="/?hash=${hashId}">點擊這裡載入完整應用</a></p>
    </noscript>
</body>
</html>`;
}

// 主要預渲染函數
async function prerenderPage(hashId) {
  console.log(`正在預渲染頁面: ${hashId}`);
  
  try {
    const shareData = await loadShareData(hashId);
    
    if (!shareData.success) {
      console.error(`載入分享數據失敗: ${shareData.error}`);
      return null;
    }
    
    const html = generateSEOHTML(shareData.data, hashId);
    
    // 確保預渲染目錄存在
    const prerenderDir = path.join(__dirname, '../build/prerender');
    if (!fs.existsSync(prerenderDir)) {
      fs.mkdirSync(prerenderDir, { recursive: true });
    }
    
    // 保存預渲染頁面
    const filePath = path.join(prerenderDir, `${hashId}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
    
    console.log(`預渲染頁面已保存到: ${filePath}`);
    return filePath;
    
  } catch (error) {
    console.error(`預渲染失敗 (${hashId}):`, error);
    return null;
  }
}

// 如果直接運行腳本
if (require.main === module) {
  const hashId = process.argv[2];
  if (!hashId) {
    console.error('請提供hash ID作為參數');
    console.log('用法: node prerender.js <hashId>');
    process.exit(1);
  }
  
  prerenderPage(hashId)
    .then(result => {
      if (result) {
        console.log('預渲染完成！');
      } else {
        console.log('預渲染失敗！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('預渲染出錯:', error);
      process.exit(1);
    });
}

module.exports = { prerenderPage, generateSEOHTML, loadShareData }; 