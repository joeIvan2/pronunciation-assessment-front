import { Tag, Favorite } from '../types/speech';

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  sentences: string[];
  tags: string[];
  url: string;
}

class SEOOptimizer {
  
  // 更新頁面標題
  updateTitle(title: string): void {
    document.title = title;
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('twitter:title', title);
  }

  // 更新頁面描述
  updateDescription(description: string): void {
    this.updateMetaTag('description', description);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('twitter:description', description);
  }

  // 更新關鍵詞
  updateKeywords(keywords: string[]): void {
    this.updateMetaTag('keywords', keywords.join(', '));
  }

  // 更新canonical URL
  updateCanonicalUrl(url: string): void {
    // 移除現有的canonical連結
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // 添加新的canonical連結
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    document.head.appendChild(canonical);

    // 更新Open Graph URL
    this.updateMetaTag('og:url', url);
    this.updateMetaTag('twitter:url', url);
  }

  // 更新meta標籤
  private updateMetaTag(name: string, content: string): void {
    // 處理不同類型的meta標籤
    let selector = '';
    if (name.startsWith('og:')) {
      selector = `meta[property="${name}"]`;
    } else if (name.startsWith('twitter:')) {
      selector = `meta[name="${name}"]`;
    } else {
      selector = `meta[name="${name}"]`;
    }

    let meta = document.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (name.startsWith('og:')) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  }

  // 添加結構化數據 (JSON-LD)
  addStructuredData(data: SEOData): void {
    // 移除現有的結構化數據
    const existing = document.querySelector('script[type="application/ld+json"][data-seo]');
    if (existing) {
      existing.remove();
    }

    // 創建新的結構化數據
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "EducationalResource",
      "name": data.title,
      "description": data.description,
      "url": data.url,
      "educationalLevel": "intermediate",
      "learningResourceType": "practice exercise",
      "inLanguage": "en",
      "about": {
        "@type": "Thing",
        "name": "English Pronunciation",
        "description": "英語發音練習和評估"
      },
      "teaches": data.keywords,
      "text": data.sentences,
      "keywords": data.keywords.concat(data.tags),
      "publisher": {
        "@type": "Organization",
        "name": "NiceTone",
        "url": window.location.origin
      },
      "dateCreated": new Date().toISOString(),
      "interactivityType": "active",
      "educationalUse": "practice",
      "typicalAgeRange": "13-99"
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'true');
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  }

  // 根據分享數據生成SEO優化內容
  generateSEOFromShareData(favorites: Favorite[], tags: Tag[], hashId: string): SEOData {
    const sentences = favorites.map(fav => fav.text).filter(text => text.length > 0);
    const tagNames = tags.map(tag => tag.name);
    
    // 生成標題
    let title = '';
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      const preview = firstSentence.length > 50 
        ? firstSentence.substring(0, 50) + '...' 
        : firstSentence;
      title = `英語發音練習：${preview} - NiceTone`;
    } else {
      title = `英語發音練習集 (${hashId}) - NiceTone`;
    }

    // 生成描述
    let description = '';
    if (sentences.length > 0) {
      description = `這個英語發音練習集包含 ${sentences.length} 個句子`;
      if (tagNames.length > 0) {
        description += `，涵蓋 ${tagNames.slice(0, 3).join('、')} 等主題`;
        if (tagNames.length > 3) {
          description += ` 等 ${tagNames.length} 個類別`;
        }
      }
      description += '。使用AI技術進行發音評估，幫助您提升英語口語能力。';
      
      // 添加前幾個句子作為預覽
      const preview = sentences.slice(0, 3).join(' | ');
      if (preview.length < 100) {
        description += ` 練習內容：${preview}`;
      }
    } else {
      description = `英語發音練習集，使用AI技術進行專業的發音評估和指導。`;
    }

    // 生成關鍵詞
    const keywords = [
      '英語發音',
      '發音練習',
      '語音評估',
      'AI評分',
      '英語學習',
      '口語練習',
      ...tagNames
    ];

    const currentUrl = window.location.href;

    return {
      title,
      description,
      keywords,
      sentences,
      tags: tagNames,
      url: currentUrl
    };
  }

  // 為分享頁面設置SEO
  optimizeForSharePage(favorites: Favorite[], tags: Tag[], hashId: string): void {
    const seoData = this.generateSEOFromShareData(favorites, tags, hashId);
    
    this.updateTitle(seoData.title);
    this.updateDescription(seoData.description);
    this.updateKeywords(seoData.keywords);
    this.updateCanonicalUrl(seoData.url);
    this.addStructuredData(seoData);

    console.log(`[SEO] 已優化分享頁面 (${hashId}):`, {
      title: seoData.title,
      description: seoData.description.substring(0, 100) + '...',
      sentencesCount: seoData.sentences.length,
      tagsCount: seoData.tags.length
    });
  }

  // 重置為默認SEO設置
  resetToDefault(): void {
    this.updateTitle('發音評估 - NiceTone');
    this.updateDescription('NiceTone 語言發音評估 - 使用AI技術提供專業的英語發音評分和指導。支援分享學習內容，與朋友一起提升英語發音能力。');
    this.updateKeywords(['英語發音', '發音評估', '語言學習', 'AI評分', '發音練習', '英語學習', '語音識別']);
    this.updateCanonicalUrl(window.location.origin);

    // 移除分享頁面的結構化數據
    const existing = document.querySelector('script[type="application/ld+json"][data-seo]');
    if (existing) {
      existing.remove();
    }

    console.log('[SEO] 已重置為默認設置');
  }

  // 為所有用戶（包括搜索引擎）預載入內容
  preloadContentForSEO(favorites: Favorite[], tags: Tag[]): void {
    // 在頁面不可見的地方添加內容，對所有用戶提供相同體驗
    let hiddenContent = document.querySelector('#seo-content') as HTMLElement;
    
    if (!hiddenContent) {
      hiddenContent = document.createElement('div') as HTMLElement;
      hiddenContent.id = 'seo-content';
      hiddenContent.setAttribute('aria-hidden', 'true'); // 對屏幕閱讀器隱藏
      hiddenContent.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
        white-space: nowrap;
      `;
      document.body.appendChild(hiddenContent);
    }

    // 添加所有句子和標籤，供搜索引擎索引
    const content = `
      <h1>英語發音練習句子</h1>
      <h2>練習標籤</h2>
      <ul>
        ${tags.map(tag => `<li>${tag.name}</li>`).join('')}
      </ul>
      <h2>練習句子</h2>
      <ol>
        ${favorites.map(fav => `<li>${fav.text}</li>`).join('')}
      </ol>
    `;
    
    hiddenContent.innerHTML = content;
    
    console.log(`[SEO] 已預載入 ${favorites.length} 個句子和 ${tags.length} 個標籤供搜索引擎抓取`);
  }
}

// 單例實例
export const seoOptimizer = new SEOOptimizer();

export default seoOptimizer; 