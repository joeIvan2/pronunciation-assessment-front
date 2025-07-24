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
        primaryColor: '#013a82',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#013a82',
        lineColor: '#44444c',
        secondaryColor: '#177cfc',
        tertiaryColor: '#dddddd',
      },
      flowchart: {
        curve: 'basis',
        padding: 20,
        nodeSpacing: 60,
        rankSpacing: 60,
        useMaxWidth: true,
        htmlLabels: true
      },
      fontSize: 14,
    });
  }, []);

  // Render mermaid diagram
  useEffect(() => {
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = '';
      
      const flowchartDefinition = isEnglish ? `
        flowchart TD
          A["👤<br/>User Entry"] --> B["🎯<br/>Pronunciation Assessment"]
          B --> B1["🧠<br/>User History Analysis"]
          B --> C["📝<br/>Pronunciation Score"]
          B1 --> R1["🌐<br/>Language Club<br/>Recommendation"]
          B1 --> R2["📰<br/>Personalized Content<br/>(News, Videos)"]
          
          subgraph "Learning Loop"
            C -->|"✅ Correct"| D["➡️<br/>Next Question"]
            C -->|"❌ Incorrect"| E["🗣️<br/>Targeted Practice"]
            D --> X["Check Progress"]
            X -->|"Continue"| B
            E --> H["🤖<br/>AI Generates<br/>New Material"]
            H --> B
          end

          subgraph "Value Generation"
            X -->|"Practice Complete"| F["📈<br/>User Skill<br/>Improvement"]
            X -->|"Practice Complete"| G["🏢<br/>Platform<br/>Monetizes Data"]
            F --> I["🏆<br/>Achieve Goals"]
            G --> J["💰<br/>Generate Revenue"]
          end
          
          classDef darkBlue fill:#013a82 !important,stroke:#44444c !important,stroke-width:2px !important,color:#f8f9fa !important;
          classDef darkGray fill:#44444c !important,stroke:#44444c !important,stroke-width:2px !important,color:#f8f9fa !important;

          class A,B1,C,E,H,G,J darkBlue;
          class B,D,X,F,I,R1,R2 darkGray;
      ` : `
        flowchart TD
          A["👤<br/>用戶進入"] --> B["🎯<br/>AI 評估發音"]
          B --> B1["🧠<br/>用戶使用歷程分析"]
          B --> C["📝<br/>發音評分"]
          B1 --> R1["🌐<br/>語言社團推薦"]
          B1 --> R2["📰<br/>個人化內容推薦<br/>(新聞、影片)"]

          subgraph "學習循環"
            C -->|"✓ 正確"| D["➡️<br/>下一題"]
            C -->|"✗ 錯誤"| E["🗣️<br/>針對性練習"]
            D --> X["檢查進度"]
            X -->|"繼續"| B
            E --> H["🤖<br/>AI 生成<br/>新練習材料"]
            H --> B
          end

          subgraph "價值生成"
            X -->|"練習完成"| F["📈<br/>用戶能力提升"]
            X -->|"練習完成"| G["🏢<br/>平台數據變現"]
            F --> I["🏆<br/>達成學習目標"]
            G --> J["💰<br/>創造營收"]
          end
          
          classDef darkBlue fill:#013a82 !important,stroke:#44444c !important,stroke-width:2px !important,color:#f8f9fa !important;
          classDef darkGray fill:#44444c !important,stroke:#44444c !important,stroke-width:2px !important,color:#f8f9fa !important;

          class A,B1,C,E,H,G,J darkBlue;
          class B,D,X,F,I,R1,R2 darkGray;
      `;

      const uniqueId = `mermaid-flowchart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      mermaid.render(uniqueId, flowchartDefinition)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        })
        .catch((error) => {
          console.error('Mermaid rendering error:', error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '<p>Flow chart loading...</p>';
          }
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
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          margin: '2rem 0',
          minHeight: '600px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #dee2e6'
        }}
      />
    </div>
  );
};

export default MermaidFlowChart;