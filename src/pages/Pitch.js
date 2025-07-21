import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import "./styles/main.css"
import { pitchTranslations } from "../translations/pitch"

// 圖標組件 (使用 SVG 圖標，藍色單色線條風格)
const Target = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
)

const TrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"></polyline>
    <polyline points="16,7 22,7 22,13"></polyline>
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

const DollarSign = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
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

const Zap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon>
  </svg>
)

const Globe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
    <path d="M2 12h20"></path>
  </svg>
)

const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
)

const BarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
)

const Code = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,18 22,12 16,6"></polyline>
    <polyline points="8,6 2,12 8,18"></polyline>
  </svg>
)

export default function PitchPlatform() {
  const [activeSection, setActiveSection] = useState("hero")
  const location = useLocation();
  const lang = location.pathname.includes('/pitch-en') ? 'en' : 'zh';
  const t = pitchTranslations[lang];

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "problem", "solution", "market", "business", "competitive", "ecosystem", "financial", "team"]
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
                { id: "problem", label: t.nav_problem },
                { id: "solution", label: t.nav_solution },
                { id: "market", label: t.nav_market },
                { id: "business", label: t.nav_business },
                { id: "competitive", label: t.nav_competitive },
                { id: "ecosystem", label: t.nav_ecosystem },
                { id: "financial", label: t.nav_financial },
                { id: "team", label: t.nav_team },
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

            <h1 className="hero-title">{t.hero_title}</h1>
            <p className="hero-description">{t.hero_subtitle}</p>

            <div className="hero-buttons">
              <button className="hero-button-primary" onClick={() => window.open("/", "_self")}>
                <Zap />
                {t.hero_button_primary}
              </button>
              <button className="hero-button-secondary" onClick={() => scrollToSection("problem")}>
                <Target />
                {t.hero_button_secondary}
              </button>
            </div>

            {/* Key Metrics */}
            <div className="hero-stats">
              {[
                { number: t.metric_1_number, label: t.metric_1_label },
                { number: t.metric_2_number, label: t.metric_2_label },
                { number: t.metric_3_number, label: t.metric_3_label },
                { number: t.metric_4_number, label: t.metric_4_label },
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

      {/* Problem Statement */}
      <section id="problem" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.problem_title}</h2>
            <p className="section-subtitle">{t.problem_subtitle}</p>
          </div>

          <div className="grid-2">
            {t.problem_points.map((point, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><Target /></div>
                  </div>
                  <h3 className="card-title">{point.title}</h3>
                  <p className="card-description">{point.description}</p>
                </div>
                <div className="card-content">
                  <ul className="card-features">
                    {point.details.map((detail, idx) => (
                      <li key={idx} className="card-feature">
                        <CheckCircle />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.solution_title}</h2>
            <p className="section-subtitle">{t.solution_subtitle}</p>
          </div>

          <div className="grid-5">
            {t.solution_features.map((feature, index) => {
              const icons = [<Zap />, <Target />, <Globe />, <BarChart />, <Code />];
              return (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon">{icons[index] || <Zap />}</div>
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-description">{feature.description}</p>
                </div>
                <div className="card-content">
                  <ul className="card-features">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="card-feature">
                        <CheckCircle />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section id="market" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.market_title}</h2>
            <p className="section-subtitle">{t.market_subtitle}</p>
          </div>

          <div className="grid-2">
            {t.market_segments.map((segment, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><TrendingUp /></div>
                  </div>
                  <h3 className="card-title">{segment.title}</h3>
                  <p className="card-description">{segment.description}</p>
                </div>
                <div className="card-content">
                  <div className="metric-grid">
                    {segment.metrics.map((metric, idx) => (
                      <div key={idx} className="metric-item">
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-label">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section id="business" className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.business_title}</h2>
            <p className="section-subtitle">{t.business_subtitle}</p>
          </div>

          <div className="grid-5">
            {t.business_models.map((model, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><DollarSign /></div>
                  </div>
                  <h3 className="card-title">{model.title}</h3>
                  <p className="card-description">{model.description}</p>
                </div>
                <div className="card-content">
                  <div className="pricing-info">
                    <div className="pricing-value">{model.pricing}</div>
                    <div className="pricing-details">{model.details}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section id="competitive" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.competitive_title}</h2>
            <p className="section-subtitle">{t.competitive_subtitle}</p>
          </div>

          <div className="grid-2">
            {t.competitive_advantages.map((advantage, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><Award /></div>
                  </div>
                  <h3 className="card-title">{advantage.title}</h3>
                  <p className="card-description">{advantage.description}</p>
                </div>
                <div className="card-content">
                  <ul className="card-features">
                    {advantage.points.map((point, idx) => (
                      <li key={idx} className="card-feature">
                        <CheckCircle />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Ecosystem */}
      <section id="ecosystem" className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.ecosystem_title}</h2>
            <p className="section-subtitle">{t.ecosystem_subtitle}</p>
          </div>

          <div className="grid-4">
            {t.ecosystem_partners.map((partner, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><Users /></div>
                  </div>
                  <h3 className="card-title">{partner.title}</h3>
                  <p className="card-description">{partner.description}</p>
                </div>
                <div className="card-content">
                  <ul className="card-features">
                    {partner.benefits.map((benefit, idx) => (
                      <li key={idx} className="card-feature">
                        <CheckCircle />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="pricing-info">
                    <div className="pricing-value">{partner.revenue_model}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Projections */}
      <section id="financial" className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.financial_title}</h2>
            <p className="section-subtitle">{t.financial_subtitle}</p>
          </div>

          <div className="grid-3">
            {t.financial_projections.map((projection, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <div className="card-icon"><TrendingUp /></div>
                  </div>
                  <h3 className="card-title">{projection.year}</h3>
                  <p className="card-description">{projection.description}</p>
                </div>
                <div className="card-content">
                  <div className="metric-grid">
                    {projection.metrics.map((metric, idx) => (
                      <div key={idx} className="metric-item">
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-label">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="section section-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.team_title}</h2>
            <p className="section-subtitle">{t.team_subtitle}</p>
          </div>

          <div className="team-single">
            {t.team_members.map((member, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="team-avatar">
                    <img
                      src="/nicetoneBlack.webp"
                      alt={member.name}
                      className="team-image"
                    />
                  </div>
                  <h3 className="card-title">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                </div>
                <div className="card-content">
                  <div className="team-details">
                    <div className="team-detail-item">
                      <strong>{t.team_education_label}</strong> {member.education}
                    </div>
                    <div className="team-detail-item">
                      <strong>{t.team_experience_label}</strong> {member.experience}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-gradient-blue">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.cta_title}</h2>
            <p className="section-subtitle">{t.cta_subtitle}</p>
          </div>

          <div className="hero-buttons">
            <button className="hero-button-primary" onClick={() => window.open("/", "_self")}>
              <Zap />
              {t.cta_button_primary}
            </button>
            <button className="hero-button-secondary" onClick={() => window.open("mailto:contact@nicetone.ai", "_blank")}>
              <Users />
              {t.cta_button_secondary}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}