import React, { useState, useEffect } from "react"
import "./styles/main.css"

// 圖標組件 (使用 SVG 圖標，藍色單色線條風格)
const Mic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
)
const Brain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
  </svg>
)
const Users = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)
const Globe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
    <path d="M2 12h20"></path>
  </svg>
)
const Star = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
  </svg>
)
const Zap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon>
  </svg>
)
const TrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"></polyline>
    <polyline points="16,7 22,7 22,13"></polyline>
  </svg>
)
const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
)
const Play = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5,3 19,12 5,21"></polygon>
  </svg>
)
const Volume2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon>
    <path d="m19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
)
const BookOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
)
const Target = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
)
const Award = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"></circle>
    <path d="m9 12 2 2 4-4"></path>
    <path d="m21 21-7-7"></path>
    <path d="m3 21 7-7"></path>
  </svg>
)
const Cloud = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
  </svg>
)
const MessageSquare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)

export default function PronunciationPlatform() {
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "features", "technology", "users", "benefits", "team", "roadmap"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="main-layout">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-logo">
              <div className="navbar-logo-wrapper">
                <img
                  src="/nicetoneBlack.webp"
                  alt="nicetone.ai"
                />
              </div>
            </div>

            <div className="navbar-menu">
              {[
                { id: "hero", label: "首頁" },
                { id: "features", label: "功能特色" },
                { id: "technology", label: "技術架構" },
                { id: "users", label: "應用場景" },
                { id: "benefits", label: "預期效益" },
                { id: "team", label: "團隊介紹" },
                { id: "roadmap", label: "發展藍圖" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`navbar-link ${activeSection === item.id ? "active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button className="navbar-cta" onClick={() => window.open("/", "_self")}>
              立即體驗
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-logo-container">
              <div className="hero-logo-wrapper">
                <img
                  src="/nicetoneBlack.webp"
                  alt="nicetone.ai"
                  className="hero-logo"
                />
                <div className="hero-badge">
                  <Zap />
                </div>
              </div>
            </div>

            <p className="hero-description">AI 智慧發音教練，讓你自信開口說出完美英語！</p>

            <div className="hero-buttons">
              <button className="hero-button-primary" onClick={() => window.open("/", "_self")}>
                <Play />
                觀看演示
              </button>
              <button className="hero-button-secondary" onClick={() => window.open("/", "_self")}>
                <BookOpen />
                了解更多
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              {[
                { number: "50萬+", label: "預期服務家庭" },
                { number: "3,000+", label: "目標企業客戶" },
                { number: "34", label: "支援語言數" },
                { number: "AI驅動", label: "智慧發音評估" },
              ].map((stat, index) => (
                <div key={index} className="hero-stat">
                  <div className="hero-stat-number">{stat.number}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">核心功能特色</h2>
            <p className="section-subtitle">整合多項 AI 技術，提供全方位的英語發音學習解決方案</p>
          </div>

          <div className="grid-3">
            {[
              {
                icon: <Mic />,
                title: "智慧發音評估",
                description: "基於 Microsoft Azure 語音服務，提供準確度、流暢度、完整度、韻律四維度評分",
                features: ["即時錄音評估", "音素級別分析", "可調整嚴格程度", "詳細錯誤偵測"],
              },
              {
                icon: <Brain />,
                title: "AI 智慧助理",
                description: "個人化學習建議，根據發音評估結果提供專業改進方案",
                features: ["學習建議", "錯誤分析", "練習推薦", "圖文輸入支援"],
              },
              {
                icon: <BookOpen />,
                title: "多元文字輸入",
                description: "支援手動輸入、語音轉文字、OCR 圖片識別等多種輸入方式",
                features: ["手動輸入", "語音轉文字", "OCR 識別", "智慧格式化"],
              },
              {
                icon: <Volume2 />,
                title: "語音合成播放",
                description: "多種 AI 語音角色，支援語速調節，提供標準發音示範",
                features: ["多語音選擇", "語速調節", "標準示範", "自然流暢"],
              },
              {
                icon: <Star />,
                title: "收藏標籤系統",
                description: "智慧收藏管理，自訂標籤分類，支援批次操作",
                features: ["一鍵收藏", "標籤管理", "分類篩選", "批次操作"],
              },
              {
                icon: <Cloud />,
                title: "雲端分享同步",
                description: "跨裝置資料同步，安全的雲端分享機制",
                features: ["雲端分享", "跨裝置同步", "版本控制", "隱私保護"],
              },
            ].map((feature, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon">{feature.icon}</div>
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-description">{feature.description}</p>
                </div>
                <div className="card-content">
                  <ul className="card-features">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="card-feature">
                        <CheckCircle />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">技術架構</h2>
            <p className="section-subtitle">採用最新 AI 技術，構建穩定可靠的學習平台</p>
          </div>

          <div className="tech-grid">
            <div>
              <h3 className="section-title">前端技術堆疊</h3>
              <div className="tech-list">
                {[
                  { tech: "React 18", desc: "現代化使用者介面框架" },
                  { tech: "TypeScript", desc: "型別安全的 JavaScript 超集" },
                  { tech: "CSS3", desc: "響應式設計和 iOS 風格介面" },
                  { tech: "Web Audio API", desc: "音訊錄製和處理" },
                ].map((item, index) => (
                  <div key={index} className="tech-item">
                    <div className="tech-bullet"></div>
                    <div>
                      <span className="tech-name">{item.tech}</span>
                      <span className="tech-desc">- {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="section-title mt-8">核心相依套件</h3>
              <div className="tech-badges">
                {[
                  "microsoft-cognitiveservices-speech-sdk",
                  "react-router-dom",
                  "crypto-js",
                  "tesseract.js",
                  "ffmpeg",
                ].map((pkg, index) => (
                  <span key={index} className="tech-badge">
                    {pkg}
                  </span>
                ))}
              </div>
            </div>

            <div className="tech-structure">
              <h3 className="tech-structure-title">專案結構</h3>
              <div className="file-tree">
                <div className="file-tree-item">src/</div>
                <div className="file-tree-item file-tree-folder">├── components/</div>
                <div className="file-tree-item file-tree-file">   ├── FavoriteList.tsx</div>
                <div className="file-tree-item file-tree-file">   ├── TagManager.tsx</div>
                <div className="file-tree-item file-tree-file">   ├── ShareData.tsx</div>
                <div className="file-tree-item file-tree-file">   └── AIDataProcessor.tsx</div>
                <div className="file-tree-item file-tree-folder">├── hooks/</div>
                <div className="file-tree-item file-tree-file">   ├── useRecorder.ts</div>
                <div className="file-tree-item file-tree-file">   ├── useAzureSpeech.ts</div>
                <div className="file-tree-item file-tree-file">   └── useBackendSpeech.ts</div>
                <div className="file-tree-item file-tree-folder">├── pages/</div>
                <div className="file-tree-item file-tree-folder">├── utils/</div>
                <div className="file-tree-item file-tree-folder">├── types/</div>
                <div className="file-tree-item file-tree-folder">└── styles/</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section id="users" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">應用場景</h2>
            <p className="section-subtitle">服務多元使用者群體，滿足不同學習需求</p>
          </div>

          <div className="grid-2">
            {[
              {
                icon: <Target />,
                title: "備考學生群體",
                description: "面臨聽力理解困難與口說恐懼的雙重挑戰",
                solutions: [
                  "安全的個人化練習環境",
                  "多維度發音評估了解錯誤位置",
                  "AI 智慧助理提供改進建議",
                  "語音合成支援多種語速調節",
                ],
                impact: "預期提升口說成績平均 20%，獲得 40% 市場佔有率",
              },
              {
                icon: <Users />,
                title: "工作忙碌的職業父母",
                description: "面臨子女英語學習輔導困境",
                solutions: [
                  "OCR 文字辨識技術拍攝課文自動生成練習",
                  "Microsoft Azure 語音服務多維度評估",
                  "AI 智慧助理個人化建議",
                  "學習歷程保留功能",
                ],
                impact: "預期服務全台超過 50 萬個家庭",
              },
              {
                icon: <Globe />,
                title: "赴海外工作專業人士",
                description: "面臨專業術語發音訓練資源匱乏",
                solutions: [
                  "支援專業術語輸入",
                  "AI 自動生成相關情境句子",
                  "標籤管理系統按產業別分類",
                  "雲端同步跨裝置學習進度",
                ],
                impact: "特別適合電子業等特殊領域從業人員",
              },
              {
                icon: <Award />,
                title: "醫療機構管理者",
                description: "面臨同仁專業英語溝通能力不足問題",
                solutions: ["醫療專業英語訓練模組", "健檢流程對話練習", "醫療術語發音訓練", "跨文化溝通技巧培訓"],
                impact: "預期服務全台 500 家醫療機構，年創造 5 億元營收",
              },
            ].map((user, index) => (
              <div key={index} className="card user-card">
                <div className="card-header">
                  <div className="user-header">
                    <div className="user-icon-wrapper">
                      <div className="card-icon">{user.icon}</div>
                    </div>
                    <div>
                      <h3 className="card-title">{user.title}</h3>
                    </div>
                  </div>
                  <p className="card-description mb-4">{user.description}</p>
                </div>
                <div className="card-content">
                  <div className="user-solutions">
                    <h4 className="user-solutions-title">解決方案：</h4>
                    <ul className="card-features">
                      {user.solutions.map((solution, idx) => (
                        <li key={idx} className="user-solution">
                          <CheckCircle />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="user-impact">
                    <h4 className="user-impact-title">預期影響：</h4>
                    <p className="user-impact-text">{user.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="section section-gradient-green">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">預期效益</h2>
            <p className="section-subtitle">創造龐大商業價值，推動台灣邁向國際化數位學習社會</p>
          </div>

          <div className="grid-3">
            {[
              {
                category: "教育領域",
                icon: <BookOpen />,
                benefits: [
                  { metric: "40-60%", desc: "學生英語口說能力提升" },
                  { metric: "50萬", desc: "預期服務家庭數量" },
                  { metric: "15-20分鐘", desc: "家長每日投入時間" },
                ],
              },
              {
                category: "企業培訓",
                icon: <TrendingUp />,
                benefits: [
                  { metric: "200億元", desc: "台灣年英語培訓市場" },
                  { metric: "20%", desc: "預期市場佔有率" },
                  { metric: "40億元", desc: "預期年營收" },
                ],
              },
              {
                category: "社會影響",
                icon: <Users />,
                benefits: [
                  { metric: "30-50%", desc: "偏鄉學生英語能力提升" },
                  { metric: "前5名", desc: "台灣英語能力亞洲排名目標" },
                  { metric: "125萬", desc: "新住民及外籍移工服務對象" },
                ],
              },
            ].map((section, index) => (
              <div key={index} className="card benefits-card">
                <div className="card-header">
                  <div className="benefits-icon-wrapper">
                    <div className="benefits-icon">{section.icon}</div>
                  </div>
                  <h3 className="card-title">{section.category}</h3>
                </div>
                <div className="card-content">
                  <div className="benefits-metrics">
                    {section.benefits.map((benefit, idx) => (
                      <div key={idx} className="benefits-metric">
                        <div className="benefits-metric-number">{benefit.metric}</div>
                        <div className="benefits-metric-desc">{benefit.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Future Expansion */}
          <div className="benefits-expansion">
            <h3 className="benefits-expansion-title">未來擴展效益</h3>
            <div className="expansion-grid">
              {[
                {
                  title: "多語言平台發展",
                  desc: "34種語言支援",
                  target: "10年內服務全球1,000萬使用者",
                  revenue: "年營收500億元",
                },
                {
                  title: "VR學習生態建構",
                  desc: "VR英語學習環境",
                  target: "開創沉浸式學習市場",
                  revenue: "創造100億元新興市場價值",
                },
                {
                  title: "企業White Label服務",
                  desc: "專屬語言學習系統",
                  target: "服務1,000家機構客戶",
                  revenue: "年營收100億元",
                },
              ].map((item, index) => (
                <div key={index} className="expansion-item">
                  <h4 className="expansion-title">{item.title}</h4>
                  <p className="expansion-desc">{item.desc}</p>
                  <div className="expansion-details">
                    <p className="expansion-target">{item.target}</p>
                    <p className="expansion-revenue">{item.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">團隊介紹</h2>
            <p className="section-subtitle">經驗豐富的創業團隊，結合學術背景與實務經驗</p>
          </div>

          <div className="grid-3">
            {[
              {
                name: "王意騏",
                role: "創辦人",
                education: "國立政治大學資訊管理學系研究所畢業 (2008-2009)",
                experience: "宏煜國際貿易股份有限公司創辦人 (2010至今)",
                avatar: "/nicetoneBlack.webp",
              },
              {
                name: "蕭伊貽",
                role: "行銷主管",
                education: "國立政治大學資訊管理學系研究所畢業 (2009-2010)",
                experience: "宏煜國際貿易股份有限公司行銷主管 (2010至今)",
                avatar: "/nicetoneBlack.webp",
              },
              {
                name: "王楷珩",
                role: "未來使用者代表",
                education: "再興小學一年級就讀中 (2024-2025)",
                experience: "代表新世代學習者觀點",
                avatar: "/nicetoneBlack.webp",
              },
            ].map((member, index) => (
              <div key={index} className="card team-card">
                <div className="card-header">
                  <div className="team-avatar">
                    <img src={member.avatar} alt={member.name} />
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                </div>
                <div className="card-content">
                  <div className="team-details">
                    <div>
                      <span className="team-detail-label">學歷：</span>
                      <br />
                      {member.education}
                    </div>
                    <div>
                      <span className="team-detail-label">經歷：</span>
                      <br />
                      {member.experience}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="section section-gradient-purple">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">發展藍圖</h2>
            <p className="section-subtitle">持續創新，引領語言學習技術發展</p>
          </div>

          <div className="space-y-12">
            {/* Current Features */}
            <div className="roadmap-section">
              <div className="roadmap-header completed">
                <CheckCircle />
                <h3 className="roadmap-title">已實作完成</h3>
              </div>
              <div className="grid-4">
                {["智慧發音評估", "AI智慧助理系統", "語音合成與多語音技術", "多模態文字輸入"].map((feature, index) => (
                  <div key={index} className="roadmap-feature">
                    <div className="roadmap-feature-content">
                      <CheckCircle />
                      <span className="roadmap-feature-text">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="roadmap-section">
              <div className="roadmap-header upcoming">
                <Zap />
                <h3 className="roadmap-title">即將推出</h3>
              </div>
              <div className="roadmap-upcoming-grid">
                {[
                  {
                    title: "多語言介面支援",
                    desc: "支援34種語言學習",
                    status: "開發中",
                  },
                  {
                    title: "語音對話練習",
                    desc: "即時AI對話互動",
                    status: "測試階段",
                  },
                  {
                    title: "社群學習功能",
                    desc: "學習夥伴配對",
                    status: "設計階段",
                  },
                  {
                    title: "遊戲成就激勵系統",
                    desc: "AI動態難度調整",
                    status: "開發中",
                  },
                  {
                    title: "虛擬化身AVATAR",
                    desc: "增加學習真實性",
                    status: "規劃中",
                  },
                  {
                    title: "AI客製化PODCAST",
                    desc: "24小時個人化內容",
                    status: "概念驗證",
                  },
                ].map((feature, index) => (
                  <div key={index} className="roadmap-upcoming-card">
                    <div className="roadmap-upcoming-header">
                      <div className="roadmap-upcoming-title-row">
                        <h4 className="roadmap-upcoming-title">{feature.title}</h4>
                        <span className="roadmap-status-badge">{feature.status}</span>
                      </div>
                      <p className="roadmap-upcoming-desc">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Long-term Vision */}
            <div className="roadmap-section">
              <div className="roadmap-header longterm">
                <Globe />
                <h3 className="roadmap-title">長期規劃</h3>
              </div>
              <div className="roadmap-longterm-grid">
                {[
                  {
                    title: "企業White Label服務",
                    desc: "服務企業內訓或學習組織，提供客製化解決方案",
                    timeline: "2-3年內",
                    impact: "預期服務1,000家機構",
                  },
                  {
                    title: "VR英文學習環境",
                    desc: "結合VEO3 SORA等AI影像生成，創造沉浸式學習體驗",
                    timeline: "3-5年內",
                    impact: "開創100億元新興市場",
                  },
                ].map((vision, index) => (
                  <div key={index} className="roadmap-longterm-card">
                    <div className="roadmap-longterm-header">
                      <h4 className="roadmap-longterm-title">{vision.title}</h4>
                      <p className="roadmap-longterm-desc">{vision.desc}</p>
                      <div className="roadmap-longterm-meta">
                        <span className="roadmap-timeline-badge">{vision.timeline}</span>
                        <span className="roadmap-impact">{vision.impact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-cta">
        <div className="cta-container">
          <h2 className="cta-title">準備好開始您的發音學習之旅了嗎？</h2>
          <p className="cta-subtitle">加入我們，體驗最先進的 AI 發音評估技術，讓英語學習更精準、更有效</p>
          <div className="cta-buttons">
            <button className="cta-button-primary" onClick={() => window.open("/", "_self")}>
              <Play />
              立即體驗
            </button>
            <button className="cta-button-secondary" onClick={() => window.open("mailto:contact@nicetone.ai", "_blank")}>
              <MessageSquare />
              聯繫我們
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section section-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <img
                  src="/nicetoneBlack.webp"
                  alt="nicetone.ai"
                />
              </div>
              <p className="footer-description">
                nicetone.ai - 基於 Microsoft Azure 語音服務的智慧發音評估平台，
                提供專業的英語發音分析、學習管理和資料分享功能。
              </p>
              <div className="footer-copyright">© 2024 宏煜國際貿易股份有限公司. All rights reserved.</div>
            </div>

            <div>
              <h3 className="footer-section-title">產品功能</h3>
              <ul className="footer-list">
                <li>智慧發音評估</li>
                <li>AI 智慧助理</li>
                <li>語音合成播放</li>
                <li>雲端分享同步</li>
              </ul>
            </div>

            <div>
              <h3 className="footer-section-title">聯繫資訊</h3>
              <ul className="footer-list">
                <li>台灣</li>
                <li>宏煜國際貿易股份有限公司</li>
                <li>創立於 2010 年</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 