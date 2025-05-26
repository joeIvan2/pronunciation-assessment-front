import React, { useState, useEffect } from "react"
import "./styles/slides.css"

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

export default function LandingSlides() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 定義所有幻燈片
  const slides = [
    // Slide 1: Hero
    {
      id: "hero",
      title: "nicetone.ai",
      content: (
        <div className="slide-hero">
          <div className="hero-logo-container">
            <img src="/nicetoneBlack.webp" alt="nicetone.ai" className="hero-logo" />
            <div className="hero-badge">
              <Zap />
            </div>
          </div>
          <h1 className="hero-title">AI 智慧發音教練</h1>
          <p className="hero-subtitle">讓你自信開口說出完美英語！</p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">50萬+</div>
              <div className="stat-label">預期服務家庭</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3,000+</div>
              <div className="stat-label">目標企業客戶</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">34</div>
              <div className="stat-label">支援語言數</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">AI驅動</div>
              <div className="stat-label">智慧發音評估</div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 2: Features Overview
    {
      id: "features",
      title: "核心功能特色",
      content: (
        <div className="slide-features">
          <h2 className="slide-title">核心功能特色</h2>
          <p className="slide-subtitle">整合多項 AI 技術，提供全方位的英語發音學習解決方案</p>
          <div className="features-grid">
            {[
              { icon: <Mic />, title: "智慧發音評估", desc: "基於 Microsoft Azure 語音服務" },
              { icon: <Brain />, title: "AI 智慧助理", desc: "個人化學習建議與改進方案" },
              { icon: <BookOpen />, title: "多元文字輸入", desc: "支援手動、語音、OCR 識別" },
              { icon: <Volume2 />, title: "語音合成播放", desc: "多種 AI 語音角色選擇" },
              { icon: <Star />, title: "收藏標籤系統", desc: "智慧收藏管理與分類" },
              { icon: <Cloud />, title: "雲端分享同步", desc: "跨裝置資料同步" }
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 3: Technology
    {
      id: "technology",
      title: "技術架構",
      content: (
        <div className="slide-technology">
          <h2 className="slide-title">技術架構</h2>
          <p className="slide-subtitle">採用最新 AI 技術，構建穩定可靠的學習平台</p>
          <div className="tech-content">
            <div className="tech-stack">
              <h3>前端技術堆疊</h3>
              <div className="tech-list">
                <div className="tech-item">
                  <span className="tech-name">React 18</span>
                  <span className="tech-desc">現代化使用者介面框架</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">TypeScript</span>
                  <span className="tech-desc">型別安全的 JavaScript 超集</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">CSS3</span>
                  <span className="tech-desc">響應式設計和 iOS 風格介面</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">Web Audio API</span>
                  <span className="tech-desc">音訊錄製和處理</span>
                </div>
              </div>
            </div>
            <div className="tech-structure">
              <h3>專案結構</h3>
              <div className="file-tree">
                <div className="file-item">src/</div>
                <div className="file-item">├── components/</div>
                <div className="file-item">├── hooks/</div>
                <div className="file-item">├── pages/</div>
                <div className="file-item">├── utils/</div>
                <div className="file-item">├── types/</div>
                <div className="file-item">└── styles/</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 4: Target Users
    {
      id: "users",
      title: "應用場景",
      content: (
        <div className="slide-users">
          <h2 className="slide-title">應用場景</h2>
          <p className="slide-subtitle">服務多元使用者群體，滿足不同學習需求</p>
          <div className="users-grid">
            {[
              {
                icon: <Target />,
                title: "備考學生群體",
                desc: "面臨聽力理解困難與口說恐懼的雙重挑戰",
                impact: "預期提升口說成績平均 20%"
              },
              {
                icon: <Users />,
                title: "工作忙碌的職業父母",
                desc: "面臨子女英語學習輔導困境",
                impact: "預期服務全台超過 50 萬個家庭"
              },
              {
                icon: <Globe />,
                title: "赴海外工作專業人士",
                desc: "面臨專業術語發音訓練資源匱乏",
                impact: "特別適合電子業等特殊領域從業人員"
              },
              {
                icon: <Award />,
                title: "醫療機構管理者",
                desc: "面臨同仁專業英語溝通能力不足問題",
                impact: "預期服務全台 500 家醫療機構"
              }
            ].map((user, index) => (
              <div key={index} className="user-card">
                <div className="user-icon">{user.icon}</div>
                <h3 className="user-title">{user.title}</h3>
                <p className="user-desc">{user.desc}</p>
                <p className="user-impact">{user.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 5: Benefits
    {
      id: "benefits",
      title: "預期效益",
      content: (
        <div className="slide-benefits">
          <h2 className="slide-title">預期效益</h2>
          <p className="slide-subtitle">創造龐大商業價值，推動台灣邁向國際化數位學習社會</p>
          <div className="benefits-grid">
            <div className="benefit-category">
              <div className="benefit-icon"><BookOpen /></div>
              <h3>教育領域</h3>
              <div className="benefit-metrics">
                <div className="metric">
                  <span className="metric-number">40-60%</span>
                  <span className="metric-desc">學生英語口說能力提升</span>
                </div>
                <div className="metric">
                  <span className="metric-number">50萬</span>
                  <span className="metric-desc">預期服務家庭數量</span>
                </div>
              </div>
            </div>
            <div className="benefit-category">
              <div className="benefit-icon"><TrendingUp /></div>
              <h3>企業培訓</h3>
              <div className="benefit-metrics">
                <div className="metric">
                  <span className="metric-number">200億元</span>
                  <span className="metric-desc">台灣年英語培訓市場</span>
                </div>
                <div className="metric">
                  <span className="metric-number">40億元</span>
                  <span className="metric-desc">預期年營收</span>
                </div>
              </div>
            </div>
            <div className="benefit-category">
              <div className="benefit-icon"><Users /></div>
              <h3>社會影響</h3>
              <div className="benefit-metrics">
                <div className="metric">
                  <span className="metric-number">前5名</span>
                  <span className="metric-desc">台灣英語能力亞洲排名目標</span>
                </div>
                <div className="metric">
                  <span className="metric-number">125萬</span>
                  <span className="metric-desc">新住民及外籍移工服務對象</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 6: Team
    {
      id: "team",
      title: "團隊介紹",
      content: (
        <div className="slide-team">
          <h2 className="slide-title">團隊介紹</h2>
          <p className="slide-subtitle">經驗豐富的創業團隊，結合學術背景與實務經驗</p>
          <div className="team-grid">
            {[
              {
                name: "王意騏",
                role: "創辦人",
                education: "國立政治大學資訊管理學系研究所畢業",
                experience: "宏煜國際貿易股份有限公司創辦人 (2010至今)"
              },
              {
                name: "蕭伊貽",
                role: "行銷主管",
                education: "國立政治大學資訊管理學系研究所畢業",
                experience: "宏煜國際貿易股份有限公司行銷主管 (2010至今)"
              },
              {
                name: "王楷珩",
                role: "未來使用者代表",
                education: "再興小學一年級就讀中",
                experience: "代表新世代學習者觀點"
              }
            ].map((member, index) => (
              <div key={index} className="team-member">
                <div className="member-avatar">
                  <img src="/nicetoneBlack.webp" alt={member.name} />
                </div>
                <h3 className="member-name">{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <div className="member-details">
                  <p><strong>學歷：</strong>{member.education}</p>
                  <p><strong>經歷：</strong>{member.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 7: Roadmap
    {
      id: "roadmap",
      title: "發展藍圖",
      content: (
        <div className="slide-roadmap">
          <h2 className="slide-title">發展藍圖</h2>
          <p className="slide-subtitle">持續創新，引領語言學習技術發展</p>
          <div className="roadmap-content">
            <div className="roadmap-section">
              <div className="roadmap-header completed">
                <CheckCircle />
                <h3>已實作完成</h3>
              </div>
              <div className="roadmap-features">
                {["智慧發音評估", "AI智慧助理系統", "語音合成與多語音技術", "多模態文字輸入"].map((feature, index) => (
                  <div key={index} className="roadmap-feature">
                    <CheckCircle />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="roadmap-section">
              <div className="roadmap-header upcoming">
                <Zap />
                <h3>即將推出</h3>
              </div>
              <div className="upcoming-features">
                {[
                  { title: "多語言介面支援", status: "開發中" },
                  { title: "語音對話練習", status: "測試階段" },
                  { title: "社群學習功能", status: "設計階段" },
                  { title: "遊戲成就激勵系統", status: "開發中" }
                ].map((feature, index) => (
                  <div key={index} className="upcoming-feature">
                    <span className="feature-title">{feature.title}</span>
                    <span className="feature-status">{feature.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 8: CTA
    {
      id: "cta",
      title: "立即開始",
      content: (
        <div className="slide-cta">
          <h2 className="cta-title">準備好開始您的發音學習之旅了嗎？</h2>
          <p className="cta-subtitle">加入我們，體驗最先進的 AI 發音評估技術，讓英語學習更精準、更有效</p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={() => window.open("/", "_self")}>
              <Play />
              立即體驗
            </button>
            <button className="cta-button secondary" onClick={() => window.open("mailto:contact@nicetone.ai", "_blank")}>
              <MessageSquare />
              聯繫我們
            </button>
          </div>
          <div className="company-info">
            <img src="/nicetoneBlack.webp" alt="nicetone.ai" className="company-logo" />
            <p>© 2024 宏煜國際貿易股份有限公司. All rights reserved.</p>
          </div>
        </div>
      )
    }
  ]

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'PageDown':
        case 'ArrowDown':
        case 'ArrowRight':
        case ' ': // 空格鍵
          event.preventDefault()
          nextSlide()
          break
        case 'PageUp':
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          prevSlide()
          break
        case 'Home':
          event.preventDefault()
          setCurrentSlide(0)
          break
        case 'End':
          event.preventDefault()
          setCurrentSlide(slides.length - 1)
          break
        case 'F11':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen()
          }
          break
        default:
          // 數字鍵 1-8 直接跳轉到對應幻燈片
          const slideNumber = parseInt(event.key)
          if (slideNumber >= 1 && slideNumber <= slides.length) {
            event.preventDefault()
            setCurrentSlide(slideNumber - 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, isFullscreen])

  // 全屏處理
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  return (
    <div className={`slides-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 導航欄 */}
      <div className="slides-nav">
        <div className="nav-left">
          <img src="/nicetoneBlack.webp" alt="nicetone.ai" className="nav-logo" />
          <span className="slide-counter">{currentSlide + 1} / {slides.length}</span>
        </div>
        <div className="nav-center">
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                title={`幻燈片 ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-button" onClick={prevSlide} disabled={currentSlide === 0}>
            ←
          </button>
          <button className="nav-button" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            →
          </button>
          <button className="nav-button fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '⊡' : '⊞'}
          </button>
        </div>
      </div>

      {/* 幻燈片內容 */}
      <div className="slides-content">
        <div 
          className="slides-wrapper"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className={`slide ${index === currentSlide ? 'active' : ''}`}>
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* 鍵盤提示 */}
      <div className="keyboard-hints">
        <div className="hint">PageDown/Space: 下一頁</div>
        <div className="hint">PageUp: 上一頁</div>
        <div className="hint">F11: 全屏</div>
        <div className="hint">1-8: 跳轉</div>
      </div>
    </div>
  )
} 