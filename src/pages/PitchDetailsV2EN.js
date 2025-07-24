import React, { useState } from 'react';
import './../styles/PitchDetailsV2.css'; // Reusing the same professional stylesheet

import MermaidFlowChart from '../components/MermaidFlowChart';

const PitchDetailsV2EN = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    { id: 'executive-summary', title: '1.0 Executive Summary' },
    { id: 'product-innovation', title: '2.0 The nicetone.ai Platform' },
    { id: 'learning-flowchart', title: 'Learning Flowchart' },
    { id: 'market-opportunity', title: '3.0 The Opportunity in Australia' },
    { id: 'strategic-fit', title: '4.0 Strategic Alignment' },
    { id: 'market-entry', title: '5.0 Go-to-Market Strategy' },
    { id: 'financials', title: '6.0 Financial Projections' },
    { id: 'conclusion', title: '7.0 Conclusion' },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`pitch-deck-container-v2 ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className={`sidebar-v2 ${sidebarOpen ? 'open' : ''}`}>
        <button 
          className="sidebar-toggle-v2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <nav className="sidebar-nav-v2">
          <h3>Table of Contents</h3>
          <ul>
            {sections.map(section => (
              <li key={section.id}>
                <button onClick={() => scrollToSection(section.id)}>
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="content-wrapper-v2">
        <header className="pitch-header-v2">
        <h1>Business Plan: nicetone.ai</h1>
        <p className="subtitle">An Integrated Entertainment and Social Portal for Professional Language Empowerment, Built for Global Users</p>
        <div className="submission-info">
          <p><strong>Submitted by:</strong> Yichi Wang, Founder & CEO</p>
          <p><strong>Date:</strong> July 24, 2025</p>
          <p><strong>Purpose:</strong> Application for the Australian Global Talent Visa (Subclass 858) - Entrepreneur Stream</p>
        </div>
      </header>

      <main>
        <section id="executive-summary">
          <h2>1.0 Executive Summary</h2>
          
          <h3>1.1. Introduction</h3>
          <p>This business plan details the strategy and vision for nicetone.ai, an innovative, AI-driven language practice portal. Our core mission is to transform the tedious process of language test preparation into an engaging, social, and highly practical empowerment experience. This document serves not only as the company's strategic blueprint for launching and expanding in the Australian market but also as comprehensive and compelling support for the founder, Mr. Yichi Wang's, application for the Australian Global Talent Visa (Subclass 858) under the Entrepreneur stream.</p>

          <h3>1.2. Core Innovation: From Prep Tool to Professional Ecosystem</h3>
          <p>Traditional learning apps typically solve a single problem in a lonely and monotonous way. The core innovation of nicetone.ai lies in creating a <strong>"Learning x Social x Entertainment"</strong> ecosystem. We not only provide top-tier practice for language proficiency tests (like PTE/IELTS/TOEFL for English, JLPT for Japanese, DELE for Spanish, etc.) but also pioneer the integration of real-world job scenario simulations for specific professions (such as nursing, engineering, and IT).</p>
          <p>This is not just a concept. Our core product is already live and operational, proving that we possess not only an innovative vision but also the technical execution capability to bring it to life. Our model significantly increases user stickiness, ensuring they not only pass exams but also confidently integrate into new professional and social environments.</p>

          <h3>1.3. Strategic Vision</h3>
          <p>The vision of nicetone.ai is to become the essential empowerment platform for every skilled migrant, international student, and global learner as they embark on a successful life in their target country. We have chosen Australia as the starting point and headquarters for our global operations, beginning with high-demand English learners. We will gradually expand our language library and service scope to ultimately become a global portal for language and cultural adaptation.</p>

          <h3>1.4. Financial Highlights & Funding Requirements</h3>
          <p>Our business model is centered on a Freemium subscription model, supplemented by B2B corporate solutions. Based on the vast potential of the Australian market and our global expansion blueprint, we project achieving an annual revenue of A$45 million within the next five years. To achieve this, nicetone.ai is seeking A$7.5 million in a seed funding round for market expansion, multilingual content development, and building our Australian team.</p>
        </section>

        <section id="product-innovation">
          <h2>2.0 The nicetone.ai Platform: Product, Innovation & Ecosystem</h2>
          
          <h3>2.1. Development & Operational Status: Product is Live</h3>
          <p>Unlike many startups seeking funding, nicetone.ai has already moved beyond the conceptual and development stages. Our core product is live and operational in the market. This means we have a proven, stable technology platform ready to serve users and generate data immediately. The current online version includes the following core features:</p>
          <ul>
            <li><strong>AI Pronunciation Assessment Engine:</strong> Real-time speech scoring and feedback based on four dimensions (accuracy, fluency, completeness, and prosody).</li>
            <li><strong>AI Practice Material Generation:</strong> Dynamically generates personalized practice sentences and paragraphs based on the user's chosen industry and weaknesses.</li>
            <li><strong>Learning Outcome Sharing:</strong> Users can easily share their practice recordings with friends or study groups for peer feedback.</li>
            <li><strong>Pronunciation History Tracking:</strong> The system tracks and visualizes a user's progress on specific words or phonemes, making improvement clear at a glance.</li>
          </ul>
          <p>This solid technical foundation allows us to focus our funding entirely on market expansion and user growth, significantly reducing investment risk.</p>

          <h3>2.2. Core Technology & Learning Methodology</h3>
          <h4>2.2.1. Foundational Technology</h4>
          <p>The cornerstone of nicetone.ai is the deep integration of Microsoft Azure Speech Services with our proprietary AI algorithms.</p>
          <h4>2.2.2. Four-Dimensional Assessment Engine</h4>
          <p>Our platform goes beyond simple right-or-wrong judgments, scoring users on accuracy, fluency, completeness, and prosody.</p>
          <h4>2.2.3. Core Learning Loop</h4>
          <p>Users follow an efficient cycle: AI Speech Assessment → Identify Pronunciation Errors → Generate Personalized Practice Materials → Re-assess.</p>

          <h3>2.3. Next-Generation Professional Social Learning Ecosystem</h3>
          <h4>2.3.1. Dual-Track Personalization Engine</h4>
          <p>Offers a "Certification Sprint Track" (covering PTE, IELTS, JLPT, etc.) and a "Career Simulation Track" to meet both short-term exam and long-term professional needs.</p>
          <h4>2.3.2. Connect & Collaborate Social Hub</h4>
          <p>Transforms solitary study into community collaboration through "Professional Study Groups" and "Ask a Senior" features.</p>
          <h4>2.3.3. Tone Currency Economy</h4>
          <p>Drives deep user engagement through a "Learn-to-Earn" gamification mechanism.</p>
        </section>

        <section id="learning-flowchart">
          <h2>Learning Flowchart</h2>
          <MermaidFlowChart isEnglish={true} />
        </section>

        <section id="market-opportunity">
          <h2>3.0 The Opportunity in Australia: A Perfect Innovation Ecosystem</h2>
          
          <h3>3.1. Market Analysis: A High-Growth Environment</h3>
          <h4>3.1.1. Market Size & Forecast</h4>
          <p>While our vision is global, starting in Australia places nicetone.ai in a large and vibrant market. Data shows that Australia's digital learning sector is experiencing unprecedented growth.</p>
          
          <div className="table-container">
            <p className="table-title">Table 1: Australian EdTech & Language Learning Market Forecast (2024-2033)</p>
            <table>
              <thead>
                <tr>
                  <th>Market Segment</th>
                  <th>2024 Market Size (AUD)</th>
                  <th>2033 Forecast (AUD)</th>
                  <th>CAGR (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Online Language Learning</td>
                  <td>~$487 Million</td>
                  <td>~$3.2 Billion</td>
                  <td>21.6%</td>
                </tr>
                <tr>
                  <td>E-Learning</td>
                  <td>~$10.2 Billion</td>
                  <td>~$27.9 Billion</td>
                  <td>11.7%</td>
                </tr>
                <tr>
                  <td>EdTech</td>
                  <td>~$5.85 Billion</td>
                  <td>~$11.1 Billion</td>
                  <td>7.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>This data clearly indicates that nicetone.ai's initial market in Australia is not only substantial but also has staggering growth potential. The 21.6% CAGR in the online language learning market, in particular, provides a solid foundation for our rapid expansion.</p>

          <h4>3.1.2. Key Market Drivers</h4>
          <ul>
            <li><strong>Immigration & International Mobility:</strong> In 2023, net overseas migration added 518,000 people to Australia's population. This group's need for English language skills is non-discretionary and forms our core initial user base.</li>
            <li><strong>Technology Integration:</strong> The market is driven by trends like AI, personalized learning, and mobile device proliferation. nicetone.ai's architecture and product philosophy are perfectly aligned with this movement.</li>
            <li><strong>Government Support:</strong> Australian government funding and strategic initiatives are actively promoting the adoption of EdTech, creating a favorable policy environment for our B2B business.</li>
          </ul>

          <h3>3.2. Target Audience: The High-Stakes Professional</h3>
          <p>Our market entry strategy precisely targets individuals whose professional success is directly tied to their language proficiency. Their needs are both urgent and multi-layered. A typical initial user profile is as follows:</p>
          <ul>
            <li><strong>Use Case:</strong> A software engineer from India who has received an invitation for Australian skilled migration. He needs to pass the PTE exam quickly to meet visa requirements, but he is more concerned about his ability to participate in fast-paced team discussions and client communications in his future job at an Australian tech company.</li>
            <li><strong>Pain Point Analysis:</strong> He needs a platform that can both efficiently help him pass the PTE and allow him to practice English for work scenarios like "daily stand-ups" and "product requirement reviews." nicetone.ai is designed to bridge this critical gap from "passing the test" to "excelling at the job."</li>
          </ul>

          <h3>3.3. Competitive Landscape & nicetone.ai's Differentiator</h3>
          <h4>Analysis of Key Competitors:</h4>
          <ul>
            <li><strong>General Language Apps (Duolingo, Busuu):</strong> Strong on entertainment but severely lacking in depth and specificity for high-stakes professional exams and career English.</li>
            <li><strong>Single-Test Prep Platforms (e.g., E2 Language, PTE Magic):</strong> Focus on test-taking tricks but completely ignore the user's practical needs after passing the exam, offering no long-term value.</li>
            <li><strong>Corporate Language Training (e.g., Go-Fluent):</strong> Expensive, typically sold only to corporate clients, and lacking the gamification and social elements that drive individual motivation.</li>
          </ul>
          <h4>nicetone.ai's Unbeatable Moat:</h4>
          <p>Our moat is <strong>"integration." We are the only platform on the market that combines efficient test prep for multiple languages, realistic career simulations, and a strong social network.</strong> Once users enter our ecosystem, they can solve all their language and social challenges in one place, from test prep to job onboarding. This high level of convenience and utility is unmatched by any single-function competitor.</p>
        </section>

        <section id="strategic-fit">
          <h2>4.0 Strategic Alignment: Why the Global Talent Visa (Subclass 858)</h2>
          
          <h3>4.1. Meeting the Core Requirements of the Entrepreneur Stream</h3>
          <ul>
            <li><strong>Record of Exceptional Achievement:</strong> Our core innovation is the "integrated professional empowerment ecosystem." Our live, operational product is itself an exceptional technological achievement, representing forward-thinking solutions to complex real-world problems in the EdTech sector.</li>
            <li><strong>Leader in a Target Sector:</strong> nicetone.ai falls squarely within the Australian government's priority target sectors of "EdTech" and "DigiTech." As the driver of this innovative model, founder Yichi Wang is leading nicetone.ai to become a rising star and a pioneering force in the field.</li>
            <li><strong>Asset to Australia:</strong> nicetone.ai will be a significant asset to Australia. We directly address the employment and integration barriers for skilled migrants, supplying the healthcare, engineering, and other critical sectors with professionals who have stronger communication skills, thereby enhancing the quality and productivity of the entire society.</li>
          </ul>

          <h3>4.2. Strategic Alignment with Australia's National Innovation Ecosystem</h3>
          <ul>
            <li><strong>Responding to National Priorities for AI & Digital Skills:</strong> The Australian government and tech industry have clearly prioritized the promotion of AI and the resolution of the digital skills shortage. nicetone.ai is a direct implementation of this national strategy, enhancing the critical soft skills of the technical talent Australia needs most.</li>
            <li><strong>Supporting Successful Integration of Skilled Migrants:</strong> A successful migration program is not just about bringing in talent, but ensuring that talent can quickly contribute their professional value. nicetone.ai provides an accelerator that helps new Australians overcome the final-mile communication barrier and make a tangible contribution to the Australian economy.</li>
            <li><strong>Supporting the Digital Economy Strategy:</strong> nicetone.ai's business model—SaaS-based, highly scalable, and globally competitive—makes it a model enterprise that the Australian Digital Economy Strategy aims to attract.</li>
          </ul>
        </section>

        <section id="market-entry">
          <h2>5.0 Go-to-Market Strategy & Operational Plan</h2>
          
          <h3>5.1. Australian Market Entry & Growth Strategy</h3>
          <p>Our market expansion will be phased, from establishing a beachhead to ecosystem expansion, and finally to global scale.</p>
          <h4>Phase 1: Establishing a Beachhead (Year 1)</h4>
          <p><strong>Target Audience & Channels:</strong> Our initial market strategy will focus on high-demand skilled migrant groups. While healthcare professionals from countries like the Philippines, India, and Nepal are a prime example, our digital marketing campaigns will be broader. We will target professionals from all major migrant source countries through precision advertising in relevant online communities, professional forums (e.g., for nursing, engineering, IT, accounting), and language test prep groups for PTE, IELTS, etc. This strategy balances targeted efficiency with market breadth.</p>
          <h4>Phase 2: B2B & Ecosystem Expansion (Years 2-3)</h4>
          <p><strong>B2B Market:</strong> Actively market our B2B solutions to local Australian businesses, hospitals, aged care facilities, and tech companies to train and improve the communication efficiency and cultural adaptation of their existing employees from overseas backgrounds.</p>
          <p><strong>API Integration:</strong> Provide standardized API access for Australian Learning Management System (LMS) providers, enabling them to seamlessly integrate our pronunciation assessment and role-playing features.</p>
          <h4>Phase 3: Global Expansion (Years 4-5)</h4>
          <p>Leverage the successful business model and brand reputation validated in the Australian market as a springboard to enter other major English-speaking markets (such as Canada, the UK, and the US) and other language markets, serving a global community of learners.</p>

          <h3>5.2. Integrated Monetization Framework</h3>
          <p>Our financial model is designed for high resilience and profitability, centered on diverse and synergistic revenue streams.</p>
          <h4>Primary Revenue Stream (B2C): Freemium Subscription</h4>
          <ul>
            <li><strong>Free Tier:</strong> Offers limited test prep exercises and basic career scenarios to attract a large user base.</li>
            <li><strong>Premium Tier (est. A$25/month):</strong> Provides unlimited test prep and full mock exams, unlocks all advanced career scenarios, offers in-depth AI pronunciation analysis reports, and grants access to the "Ask a Senior" mentorship program.</li>
          </ul>
          <h4>Secondary Revenue Streams</h4>
          <ul>
            <li><strong>B2B Corporate Solutions:</strong> Customized annual training packages based on company size and user count, including an admin dashboard and data reporting.</li>
            <li><strong>Education API Licensing:</strong> Per-student, per-month fees for third-party learning platforms to integrate our technology.</li>
            <li><strong>White Label Licensing:</strong> License our core technology to other education companies to market under their own brand.</li>
          </ul>
        </section>

        <section id="financials">
          <h2>6.0 Financial Projections & Funding Requirements</h2>
          
          <h3>6.1. Revenue & Growth Projections (5-Year Outlook)</h3>
          <h4>6.1.1. Key Assumptions</h4>
          <ul>
            <li>Annual User Growth Rate: 25%</li>
            <li>Paid Conversion Rate (Freemium): Steadily growing from 5% initially to 15%.</li>
            <li>Average Revenue Per B2C User (ARPU): A$300 per year.</li>
            <li>B2B revenue commences in Year 2 and grows annually.</li>
          </ul>

          <h4>6.1.2. Revenue & Profit Forecast</h4>
          <div className="table-container">
            <p className="table-title">Table 2: 5-Year Financial Forecast Summary (A$ Millions)</p>
            <table>
              <thead>
                <tr>
                  <th>Fiscal Year</th>
                  <th>Year 1</th>
                  <th>Year 2</th>
                  <th>Year 3</th>
                  <th>Year 4</th>
                  <th>Year 5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Revenue</td>
                  <td>$0.8</td>
                  <td>$3.5</td>
                  <td>$9.2</td>
                  <td>$21.0</td>
                  <td>$45.0</td>
                </tr>
                <tr>
                  <td>Subscriptions (B2C)</td>
                  <td>$0.8</td>
                  <td>$2.5</td>
                  <td>$6.0</td>
                  <td>$12.0</td>
                  <td>$25.0</td>
                </tr>
                <tr>
                  <td>Corporate Solutions (B2B)</td>
                  <td>$0.0</td>
                  <td>$1.0</td>
                  <td>$3.2</td>
                  <td>$9.0</td>
                  <td>$20.0</td>
                </tr>
                <tr>
                  <td>Total Costs</td>
                  <td>$1.5</td>
                  <td>$2.8</td>
                  <td>$5.5</td>
                  <td>$10.5</td>
                  <td>$20.0</td>
                </tr>
                <tr>
                  <td>Platform & Cloud Costs</td>
                  <td>$0.3</td>
                  <td>$0.6</td>
                  <td>$1.2</td>
                  <td>$2.5</td>
                  <td>$5.0</td>
                </tr>
                <tr>
                  <td>Salaries & Operations (Australia)</td>
                  <td>$0.7</td>
                  <td>$1.2</td>
                  <td>$2.5</td>
                  <td>$4.5</td>
                  <td>$8.0</td>
                </tr>
                <tr>
                  <td>Sales & Marketing</td>
                  <td>$0.5</td>
                  <td>$1.0</td>
                  <td>$1.8</td>
                  <td>$3.5</td>
                  <td>$7.0</td>
                </tr>
                <tr>
                  <td>Net Profit/Loss</td>
                  <td>($0.7)</td>
                  <td>$0.7</td>
                  <td>$3.7</td>
                  <td>$10.5</td>
                  <td>$25.0</td>
                </tr>
                <tr>
                  <td>Net Margin (%)</td>
                  <td>N/A</td>
                  <td>20%</td>
                  <td>40%</td>
                  <td>50%</td>
                  <td>56%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>6.2. Use of Funds & Capital Plan</h3>
          <h4>6.2.1. Funding Requirement</h4>
          <p>To achieve the growth targets outlined above, nicetone.ai is seeking a total of <strong>A$7.5 million</strong> in a seed funding round.</p>

          <h4>6.2.2. Use of Seed Funding</h4>
          <p>The initial capital will be strictly allocated to market expansion and product enhancement in Australia, not development from scratch.</p>
          <div className="table-container">
            <p className="table-title">Table 3: Use of Seed Funding</p>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Allocation (%)</th>
                  <th>Amount (AUD)</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Product & Content Enhancement</td>
                  <td>40%</td>
                  <td>$3,000,000</td>
                  <td>Expand the library of career simulation scenarios (e.g., for engineering, IT), develop new language content, and enhance social and gamification features based on the live product.</td>
                </tr>
                <tr>
                  <td>Marketing & Community Building</td>
                  <td>30%</td>
                  <td>$2,250,000</td>
                  <td>Comprehensive digital marketing, partnership development, and brand promotion targeting the Australian market.</td>
                </tr>
                <tr>
                  <td>Operations & Personnel (Australia)</td>
                  <td>20%</td>
                  <td>$1,500,000</td>
                  <td>Cover leasing for an Australian office, salaries for the initial local team (marketing, operations), and overheads.</td>
                </tr>
                <tr>
                  <td>Legal & Administrative</td>
                  <td>10%</td>
                  <td>$750,000</td>
                  <td>Company registration, intellectual property protection, accounting, and legal fees.</td>
                </tr>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>100%</strong></td>
                  <td><strong>$7,500,000</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>6.3. Profitability & Investment Analysis</h3>
          <h4>6.3.1. Path to Profitability</h4>
          <p>As shown in the financial forecast, the company is expected to be in a strategic loss-making phase in its first year of operation, primarily due to significant investment in market entry and user acquisition. Starting from the second year, with the steady growth of the paid subscriber base and the launch of the B2B business, the company will achieve healthy profitability and continue to expand its profit margins thereafter.</p>
          <h4>6.3.2. Return on Investment (ROI)</h4>
          <p>This project offers a highly attractive potential return for early investors. Compared to simple tool-based apps, our ecosystem model builds higher user loyalty and a longer lifetime value (LTV). This sustainable, high-stickiness business model signals strong long-term growth potential and a robust return on investment.</p>
          <h4>6.3.3. Valuation</h4>
          <p>Based on comparable companies in the market, our unique "integrated professional empowerment" model, our live product, and clear market demand, we have set a pre-seed valuation for nicetone.ai of <strong>A$15 million</strong>.</p>
        </section>

        <section id="conclusion">
          <h2>7.0 Conclusion & Call to Action</h2>
          <p>nicetone.ai is more than just a language learning app; it is an innovative ecosystem designed to solve the core challenges faced by global learners in cross-cultural integration. We have skillfully combined efficient test preparation for multiple languages, practical career training, and a supportive social network, and have already transformed this vision into a product that is live and operational in the global market.</p>
          <p>Our choice of Australia as our global launchpad and headquarters is based on deep confidence in its market potential, talent pool, and policy environment. The success of nicetone.ai will directly bring significant social and economic benefits to Australia.</p>
          <p>We sincerely submit this business plan in support of our application for the Global Talent Visa (Subclass 858). We firmly believe that under the leadership of Mr. Yichi Wang, nicetone.ai will become a key tool in empowering hundreds of thousands of global citizens to succeed and will grow from Australia into a model enterprise that showcases Australian innovation on the global stage.</p>
        </section>
      </main>
    </div>
  </div>
  );
};

export default PitchDetailsV2EN;
