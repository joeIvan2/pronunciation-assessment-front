const fs = require('fs');
const path = require('path');

// 生成sitemap.xml
function generateSitemap(shareHashIds = []) {
  const baseUrl = 'https://nicetone.ai'; // 替換為您的實際域名
  const currentDate = new Date().toISOString().split('T')[0];
  
  // 基本頁面
  const staticPages = [
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/intro`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];
  
  // 分享頁面
  const sharePages = shareHashIds.map(hashId => ({
    url: `${baseUrl}/?hash=${hashId}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.7'
  }));
  
  const allPages = [...staticPages, ...sharePages];
  
  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemapXML;
}

// 保存sitemap到public目錄
function saveSitemap(sitemapContent) {
  const publicDir = path.join(__dirname, '../public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log(`Sitemap已保存到: ${sitemapPath}`);
  
  return sitemapPath;
}

// 主函數
async function generateAndSaveSitemap() {
  try {
    // 這裡可以從數據庫或其他來源獲取所有的分享hash ID
    // 暫時使用一些示例ID
    const shareHashIds = [
      'example1',
      'example2',
      'pte-wfd-ra-6month'
    ];
    
    console.log(`正在為 ${shareHashIds.length} 個分享頁面生成sitemap...`);
    
    const sitemapContent = generateSitemap(shareHashIds);
    const savedPath = saveSitemap(sitemapContent);
    
    console.log('Sitemap生成完成！');
    console.log(`包含 ${shareHashIds.length + 2} 個頁面`);
    
    return savedPath;
    
  } catch (error) {
    console.error('生成sitemap失敗:', error);
    throw error;
  }
}

// 如果直接運行腳本
if (require.main === module) {
  generateAndSaveSitemap()
    .then(() => {
      console.log('✅ Sitemap生成成功！');
    })
    .catch(error => {
      console.error('❌ Sitemap生成失敗:', error);
      process.exit(1);
    });
}

module.exports = { generateSitemap, saveSitemap, generateAndSaveSitemap }; 