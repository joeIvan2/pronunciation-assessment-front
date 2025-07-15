import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import "./styles/main.css"
import { translations } from "../translations/landing"

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
  const location = useLocation();
  const lang = location.pathname.includes('/intro-en') ? 'en' : 'zh';
  const t = translations[lang];

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
                { id: "hero", label: t.nav_home },
                { id: "features", label: t.nav_features },
                { id: "technology", label: t.nav_technology },
                { id: "users", label: t.nav_users },
                { id: "benefits", label: t.nav_benefits },
                { id: "team", label: t.nav_team },
                { id: "roadmap", label: t.nav_roadmap },
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
              {t.nav_cta}
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

              </div>
            </div>

            <p className="hero-description">{t.hero_subtitle}</p>

            <div className="hero-buttons">
              <button className="hero-button-primary" onClick={() => window.open("/", "_self")}>
                <Play />
                {t.hero_button_primary}
              </button>
              <button className="hero-button-secondary" onClick={() => window.open("/", "_self")}>
                <BookOpen />
                {t.hero_button_secondary}
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              {[
                { number: t.stat_1_number, label: t.stat_1_label },
                { number: t.stat_2_number, label: t.stat_2_label },
                { number: t.stat_3_number, label: t.stat_3_label },
                { number: "AI Driven", label: t.stat_4_label },
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
            <h2 className="section-title">{t.features_title}</h2>
            <p className="section-subtitle">{t.features_subtitle}</p>
          </div>

          <div className="grid-3">
            {[
              {
                icon: <Mic />,
                title: t.feature_1_title,
                description: t.feature_1_desc,
                features: t.feature_1_items,
              },
              {
                icon: <Brain />,
                title: t.feature_2_title,
                description: t.feature_2_desc,
                features: t.feature_2_items,
              },
              {
                icon: <BookOpen />,
                title: t.feature_3_title,
                description: t.feature_3_desc,
                features: t.feature_3_items,
              },
              {
                icon: <Volume2 />,
                title: t.feature_4_title,
                description: t.feature_4_desc,
                features: t.feature_4_items,
              },
              {
                icon: <Star />,
                title: t.feature_5_title,
                description: t.feature_5_desc,
                features: t.feature_5_items,
              },
              {
                icon: <Cloud />,
                title: t.feature_6_title,
                description: t.feature_6_desc,
                features: t.feature_6_items,
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
            <h2 className="section-title">{t.tech_title}</h2>
            <p className="section-subtitle">{t.tech_subtitle}</p>
          </div>

          <div className="tech-grid">
            <div>
              <h3 className="section-title">{t.tech_stack_title}</h3>
              <div className="tech-list">
                {[
                  { tech: "React 18", desc: t.tech_stack_1 },
                  { tech: "TypeScript", desc: t.tech_stack_2 },
                  { tech: "CSS3", desc: t.tech_stack_3 },
                  { tech: "Web Audio API", desc: t.tech_stack_4 },
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

              <h3 className="section-title mt-8">{t.tech_dependencies_title}</h3>
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

            <div className="tech-breakdown">
              <h3 className="tech-structure-title">{t.tech_breakdown_title}</h3>
              <p className="section-subtitle" style={{textAlign: 'left', marginBottom: '2rem'}} dangerouslySetInnerHTML={{ __html: t.tech_breakdown_subtitle }}></p>
              <div className="tech-files-grid">
                <div className="tech-file-card">
                  <h4>{t.file_analysis_1_title}</h4>
                  <h5>{t.file_analysis_1_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_1_desc }}></p>
                    <ul>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_1_item_1 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_1_item_2 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_1_item_3 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_1_item_4 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_1_item_5 }}></li>
                    </ul>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_1_conclusion }}></p>
                </div>
                <div className="tech-file-card">
                  <h4>{t.file_analysis_2_title}</h4>
                  <h5>{t.file_analysis_2_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_2_desc }}></p>
                    <ul>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_2_item_1 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_2_item_2 }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t.file_analysis_2_item_3 }}></li>
                    </ul>
                </div>
                <div className="tech-file-card">
                  <h4>{t.file_analysis_3_title}</h4>
                  <h5>{t.file_analysis_3_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_3_desc }}></p>
                </div>
                <div className="tech-file-card">
                  <h4>{t.file_analysis_4_title}</h4>
                  <h5>{t.file_analysis_4_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_4_desc }}></p>
                </div>
                <div className="tech-file-card">
                  <h4>{t.file_analysis_5_title}</h4>
                  <h5>{t.file_analysis_5_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_5_desc }}></p>
                </div>
                <div className="tech-file-card">
                  <h4>{t.file_analysis_6_title}</h4>
                  <h5>{t.file_analysis_6_subtitle}</h5>
                  <p dangerouslySetInnerHTML={{ __html: t.file_analysis_6_desc }}></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section id="users" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.users_title}</h2>
            <p className="section-subtitle">{t.users_subtitle}</p>
          </div>

          <div className="grid-2">
            {[
              {
                icon: <Target />,
                title: t.user_1_title,
                description: t.user_1_desc,
                solutions_title: t.user_1_solution_title,
                solutions: t.user_1_solutions,
                impact_title: t.user_1_impact_title,
                impact: t.user_1_impact,
              },
              {
                icon: <Users />,
                title: t.user_2_title,
                description: t.user_2_desc,
                solutions_title: t.user_2_solution_title,
                solutions: t.user_2_solutions,
                impact_title: t.user_2_impact_title,
                impact: t.user_2_impact,
              },
              {
                icon: <Globe />,
                title: t.user_3_title,
                description: t.user_3_desc,
                solutions_title: t.user_3_solution_title,
                solutions: t.user_3_solutions,
                impact_title: t.user_3_impact_title,
                impact: t.user_3_impact,
              },
              {
                icon: <Award />,
                title: t.user_4_title,
                description: t.user_4_desc,
                solutions_title: t.user_4_solution_title,
                solutions: t.user_4_solutions,
                impact_title: t.user_4_impact_title,
                impact: t.user_4_impact,
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
                    <h4 className="user-solutions-title">{user.solutions_title}</h4>
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
                    <h4 className="user-impact-title">{user.impact_title}</h4>
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
            <h2 className="section-title">{t.benefits_title}</h2>
            <p className="section-subtitle">{t.benefits_subtitle}</p>
          </div>

          <div className="grid-3">
            {[
              {
                category: t.benefit_1_category,
                icon: <BookOpen />,
                benefits: t.benefit_1_metrics,
              },
              {
                category: t.benefit_2_category,
                icon: <TrendingUp />,
                benefits: t.benefit_2_metrics,
              },
              {
                category: t.benefit_3_category,
                icon: <Users />,
                benefits: t.benefit_3_metrics,
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
            <h3 className="benefits-expansion-title">{t.expansion_title}</h3>
            <div className="expansion-grid">
              {[
                {
                  title: t.expansion_1_title,
                  desc: t.expansion_1_desc,
                  target: t.expansion_1_target,
                  revenue: t.expansion_1_revenue,
                },
                {
                  title: t.expansion_2_title,
                  desc: t.expansion_2_desc,
                  target: t.expansion_2_target,
                  revenue: t.expansion_2_revenue,
                },
                {
                  title: t.expansion_3_title,
                  desc: t.expansion_3_desc,
                  target: t.expansion_3_target,
                  revenue: t.expansion_3_revenue,
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
            <h2 className="section-title">{t.team_title}</h2>
            <p className="section-subtitle">{t.team_subtitle}</p>
          </div>

          <div className="grid-3">
            {[
              {
                name: t.member_1_name,
                role: t.member_1_role,
                education: t.member_1_edu,
                experience: t.member_1_exp,
                avatar: "/nicetoneBlack.webp",
              },
              {
                name: t.member_2_name,
                role: t.member_2_role,
                education: t.member_2_edu,
                experience: t.member_2_exp,
                avatar: "/nicetoneBlack.webp",
              },
              {
                name: t.member_3_name,
                role: t.member_3_role,
                education: t.member_3_edu,
                experience: t.member_3_exp,
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
                      <span className="team-detail-label">{t.detail_label_edu}</span>
                      <br />
                      {member.education}
                    </div>
                    <div>
                      <span className="team-detail-label">{t.detail_label_exp}</span>
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
            <h2 className="section-title">{t.roadmap_title}</h2>
            <p className="section-subtitle">{t.roadmap_subtitle}</p>
          </div>

          <div className="space-y-12">
            {/* Current Features */}
            <div className="roadmap-section">
              <div className="roadmap-header completed">
                <CheckCircle />
                <h3 className="roadmap-title">{t.roadmap_section_1_title}</h3>
              </div>
              <div className="grid-4">
                {t.roadmap_section_1_items.map((feature, index) => (
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
                <h3 className="roadmap-title">{t.roadmap_section_2_title}</h3>
              </div>
              <div className="roadmap-upcoming-grid">
                {t.roadmap_section_2_items.map((feature, index) => (
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
                <h3 className="roadmap-title">{t.roadmap_section_3_title}</h3>
              </div>
              <div className="roadmap-longterm-grid">
                {t.roadmap_section_3_items.map((vision, index) => (
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
          <h2 className="cta-title">{t.cta_title}</h2>
          <p className="cta-subtitle">{t.cta_subtitle}</p>
          <div className="cta-buttons">
            <button className="cta-button-primary" onClick={() => window.open("/", "_self")}>
              <Play />
              {t.cta_button_primary}
            </button>
            <button className="cta-button-secondary" onClick={() => window.open("mailto:contact@nicetone.ai", "_blank")}>
              <MessageSquare />
              {t.cta_button_secondary}
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
                {t.footer_desc}
              </p>
              <div className="footer-copyright">{t.footer_copyright}</div>
            </div>

            <div>
              <h3 className="footer-section-title">{t.footer_links_1_title}</h3>
              <ul className="footer-list">
                {t.footer_links_1_items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="footer-section-title">{t.footer_links_2_title}</h3>
              <ul className="footer-list">
                {t.footer_links_2_items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}