import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const MermaidFlowChart = ({ isEnglish = false }) => {
  const mermaidRef = useRef(null);

  // Initialize mermaid with configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#1d4ed8',
        lineColor: '#6366f1',
        secondaryColor: '#10b981',
        tertiaryColor: '#ef4444',
        background: '#ffffff',
        mainBkg: '#3b82f6',
        secondBkg: '#10b981',
        tertiaryBkg: '#ef4444',
        clusterBkg: '#f8fafc',
        clusterBorder: '#e2e8f0'
      },
      flowchart: {
        curve: 'basis',
        padding: 20,
        nodeSpacing: 80,
        rankSpacing: 80,
        useMaxWidth: true,
        htmlLabels: false
      },
      wrap: false,
      fontSize: 13,
      maxTextSize: 90000
    });
  }, []);

  // Render mermaid diagram
  useEffect(() => {
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = '';
      
      const flowchartDefinition = isEnglish ? `
        flowchart TD
          A["👤 User Entry"] --> B["🎯 AI Assessment"]
          B --> C["Decision"]
          C -->|"✅ Correct"| D["➡️ Next Question"]
          C -->|"❌ Incorrect"| E["📝 Practice"]
          D --> X["Question Check"]
          X -->|"Has More"| Y["Continue Learning"]
          X -->|"Complete Practice"| F["👤 User Progress"]
          X -->|"Complete Practice"| G["🏢 Platform Data"]
          Y --> B
          E --> H["🤖 AI Generate Questions"]
          H --> B
          F --> I["📈 Level Up"]
          G --> J["💰 Data Monetization"]
          I --> K["🏆 Success"]
          J --> L["💎 100x Profit"]
          
          style A fill:#3b82f6,stroke:#1d4ed8,color:#fff
          style B fill:#6366f1,stroke:#4338ca,color:#fff
          style C fill:#f59e0b,stroke:#d97706,color:#fff
          style D fill:#10b981,stroke:#059669,color:#fff
          style E fill:#fecaca,stroke:#f87171,color:#dc2626
          style X fill:#e5e7eb,stroke:#9ca3af,color:#374151
          style Y fill:#10b981,stroke:#059669,color:#fff
          style F fill:#06b6d4,stroke:#0891b2,color:#fff
          style G fill:#f97316,stroke:#ea580c,color:#fff
          style H fill:#9333ea,stroke:#7c3aed,color:#fff
          style I fill:#22c55e,stroke:#16a34a,color:#fff
          style J fill:#f59e0b,stroke:#d97706,color:#fff
          style K fill:#8b5cf6,stroke:#7c3aed,color:#fff
          style L fill:#ec4899,stroke:#db2777,color:#fff
      ` : `
        flowchart TD
          A["👤 用戶進入"] --> B["🎯 AI評估"]
          B --> C["決策分支"]
          C -->|"✓ 正確"| D["➡️ 下一題"]
          C -->|"✗ 錯誤"| E["📝 練習"]
          D --> X["題目檢查"]
          X -->|"還有題目"| Y["繼續學習"]
          X -->|"完成練習"| F["👤 用戶 程度提升"]
          X -->|"完成練習"| G["🏢 平台 發音數據變現"]
          Y --> B
          E --> H["🤖 AI出題"]
          H --> B
          F --> I["📈 等級提升"]
          G --> J["💰 數據變現"]
          I --> K["🏆 學習成功"]
          J --> L["💎 100倍利潤"]
          
          style A fill:#3b82f6,stroke:#1d4ed8,color:#fff
          style B fill:#6366f1,stroke:#4338ca,color:#fff
          style C fill:#f59e0b,stroke:#d97706,color:#fff
          style D fill:#10b981,stroke:#059669,color:#fff
          style E fill:#fecaca,stroke:#f87171,color:#dc2626
          style X fill:#e5e7eb,stroke:#9ca3af,color:#374151
          style Y fill:#10b981,stroke:#059669,color:#fff
          style F fill:#06b6d4,stroke:#0891b2,color:#fff
          style G fill:#f97316,stroke:#ea580c,color:#fff
          style H fill:#9333ea,stroke:#7c3aed,color:#fff
          style I fill:#22c55e,stroke:#16a34a,color:#fff
          style J fill:#f59e0b,stroke:#d97706,color:#fff
          style K fill:#8b5cf6,stroke:#7c3aed,color:#fff
          style L fill:#ec4899,stroke:#db2777,color:#fff
      `;

      const uniqueId = `mermaid-flowchart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      mermaid.render(uniqueId, flowchartDefinition)
        .then(({ svg }) => {
          mermaidRef.current.innerHTML = svg;
        })
        .catch((error) => {
          console.error('Mermaid rendering error:', error);
          mermaidRef.current.innerHTML = '<p>Flow chart loading...</p>';
        });
    }
  }, [isEnglish]);

  return (
    <div className="mermaid-container">
      <div 
        ref={mermaidRef} 
        className="mermaid-flowchart"
        style={{ 
          textAlign: 'center', 
          padding: '30px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '1rem',
          margin: '2rem 0',
          minHeight: '550px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible'
        }}
      />
    </div>
  );
};

export default MermaidFlowChart;