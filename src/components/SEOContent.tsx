import React from 'react';

interface SEOContentProps {
  shareData?: {
    favorites: Array<{ text: string; id: string }>;
    tags: Array<{ name: string; color: string }>;
    metadata?: {
      title?: string;
      description?: string;
      createdAt?: number;
    };
  };
  shareId?: string;
}

const SEOContent: React.FC<SEOContentProps> = ({ shareData, shareId }) => {
  if (!shareData || !shareId) return null;

  return (
    <div 
      style={{ display: 'none' }} 
      itemScope 
      itemType="https://schema.org/EducationalContent"
      data-seo-content="true"
    >
      {/* 基本信息 */}
      <h1 itemProp="name">
        {shareData.metadata?.title || `英語發音學習分享 - ${shareId}`}
      </h1>
      
      <meta itemProp="description" content={
        shareData.metadata?.description || 
        `包含 ${shareData.favorites.length} 個學習句子和 ${shareData.tags.length} 個標籤的英語發音學習內容分享`
      } />
      
      <meta itemProp="dateCreated" content={
        shareData.metadata?.createdAt ? 
        new Date(shareData.metadata.createdAt).toISOString() : 
        new Date().toISOString()
      } />
      
      <meta itemProp="educationalLevel" content="All Levels" />
      <meta itemProp="inLanguage" content="en" />
      <meta itemProp="learningResourceType" content="Pronunciation Practice" />
      
      {/* 分享的句子內容 */}
      <div itemProp="text">
        <h2>學習句子內容</h2>
        {shareData.favorites.map((favorite, index) => (
          <div key={favorite.id || index} itemScope itemType="https://schema.org/Quotation">
            <p itemProp="text">{favorite.text}</p>
            <meta itemProp="inLanguage" content="en" />
          </div>
        ))}
      </div>
      
      {/* 標籤信息 */}
      {shareData.tags.length > 0 && (
        <div>
          <h2>相關標籤</h2>
          {shareData.tags.map((tag, index) => (
            <span key={index} itemProp="keywords">{tag.name}</span>
          ))}
        </div>
      )}
      
      {/* 應用信息 */}
      <div itemScope itemType="https://schema.org/SoftwareApplication">
        <meta itemProp="name" content="英語發音評估工具" />
        <meta itemProp="applicationCategory" content="EducationalApplication" />
        <meta itemProp="operatingSystem" content="Web Browser" />
        <meta itemProp="description" content="AI 驅動的英語發音評估和學習工具，幫助用戶改善英語發音" />
      </div>
      
      {/* JSON-LD 結構化數據 */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalContent",
          "name": shareData.metadata?.title || `英語發音學習分享 - ${shareId}`,
          "description": shareData.metadata?.description || 
            `包含 ${shareData.favorites.length} 個學習句子和 ${shareData.tags.length} 個標籤的英語發音學習內容分享`,
          "dateCreated": shareData.metadata?.createdAt ? 
            new Date(shareData.metadata.createdAt).toISOString() : 
            new Date().toISOString(),
          "educationalLevel": "All Levels",
          "inLanguage": "en",
          "learningResourceType": "Pronunciation Practice",
          "text": shareData.favorites.map(f => f.text).join('\n'),
          "keywords": shareData.tags.map(t => t.name).join(', '),
          "about": {
            "@type": "Thing",
            "name": "English Pronunciation Learning"
          },
          "isPartOf": {
            "@type": "SoftwareApplication",
            "name": "英語發音評估工具",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser"
          }
        })}
      </script>
    </div>
  );
};

export default SEOContent; 