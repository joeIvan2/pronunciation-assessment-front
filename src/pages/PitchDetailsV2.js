import React, { useState } from 'react';
import './../styles/PitchDetailsV2.css';

import MermaidFlowChart from '../components/MermaidFlowChart';

const PitchDetailsV2 = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    { id: 'executive-summary', title: '1.0 執行摘要' },
    { id: 'product-innovation', title: '2.0 nicetone.ai 平台' },
    { id: 'learning-flowchart', title: '學習流程圖' },
    { id: 'market-opportunity', title: '3.0 澳洲的機遇' },
    { id: 'strategic-fit', title: '4.0 戰略契合' },
    { id: 'market-entry', title: '5.0 市場進入策略' },
    { id: 'financials', title: '6.0 財務預測' },
    { id: 'conclusion', title: '7.0 結論' },
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
          <h3>目錄</h3>
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
        <h1>商業計畫書：nicetone.ai</h1>
        <p className="subtitle">一個整合娛樂與社交，專為全球用戶打造的職業語言賦能入口網站</p>
        <div className="submission-info">
          <p><strong>提交人：</strong> 王意騏 (Yichi Wang)，創辦人兼首席執行官</p>
          <p><strong>日期：</strong> 2025年7月24日</p>
          <p><strong>目的：</strong> 申請澳洲國家創新簽證（子類別 858）企業家類別</p>
        </div>
      </header>

      <main>
        <section id="executive-summary">
          <h2>1.0 執行摘要</h2>
          
          <h3>1.1. 簡介</h3>
          <p>本商業計畫書旨在詳細闡述 nicetone.ai 的策略與願景。nicetone.ai 是一個創新型、由人工智慧（AI）驅動的語言練習入口網站，其核心使命是將枯燥的語言備考過程，轉變為一個充滿娛樂性、社交性和高度實用性的賦能體驗。本文件不僅是公司在澳洲市場啟動與擴張的戰略藍圖，其核心目的更是為創辦人王意騏先生申請澳洲國家創新簽證（子類別 858）企業家類別提供全面且具說服力的支持。</p>

          <h3>1.2. 核心創新：從備考工具到職業生態</h3>
          <p>傳統學習App通常只能解決單一問題，且過程孤獨乏味。nicetone.ai 的核心創新在於創建了一個<strong>「學習x社交x娛樂」</strong>的生態系統。我們不僅可以提供頂尖的語言能力測試備考練習（如英語的PTE/IELTS/TOEFL，日語的JLPT，西班牙語的DELE等），更開創性地融入了針對特定職業（如護理、工程、IT）的真實工作場景模擬。</p>
          <p>這並非紙上談兵。我們的核心產品已經上線運營，這證明了我們不僅有創新的理念，更有將其付諸實現的技術執行力。我們的創新模式極大地提高了用戶的學習黏著度 (stickiness)，確保他們不僅能通過考試，更能自信地融入全新的職場與生活環境。</p>

          <h3>1.3. 戰略願景</h3>
          <p>nicetone.ai 的願景是成為每一位技術移民、國際學生和全球學習者，在他們即將前往的目標國家開啟成功人生的必備賦能平台。我們選擇以澳洲作為全球營運的起點和總部，並從服務高需求的英語學習者開始，未來將逐步擴展我們的語言庫和服務範圍，最終成為一個全球性的語言與文化適應入口網站。</p>

          <h3>1.4. 財務亮點與融資需求</h3>
          <p>我們的商業模式以 Freemium（免費增值）訂閱為核心，輔以 B2B 企業合作方案。基於澳洲市場的巨大潛力以及全球擴張的藍圖，我們預測在未來五年內實現 4,500 萬澳元的年營收。為此，nicetone.ai 尋求 750 萬澳元的種子輪融資，用於市場擴張、多語言內容深化及澳洲團隊建設。</p>
        </section>

        <section id="product-innovation">
          <h2>2.0 nicetone.ai 平台：產品、創新與生態系統</h2>
          
          <h3>2.1. 開發與運營狀態：產品已上線</h3>
          <p>與許多尋求融資的初創公司不同，nicetone.ai 已經跨越了概念和開發階段，我們的核心產品已在市場上線運營。這意味著我們擁有一個經過驗證的、穩定的技術平台，能夠立即服務用戶並產生數據。現有線上版本已實現以下核心功能：</p>
          <ul>
            <li><strong>AI 發音評估引擎：</strong> 基於四維度（準確度、流暢度、完整度、韻律）的即時語音評分與反饋。</li>
            <li><strong>AI 練習語料生成：</strong> 能夠根據用戶選擇的行業和弱點，動態生成個人化的練習句子與段落。</li>
            <li><strong>學習成果分享：</strong> 用戶可以輕鬆地將自己的發音練習錄音分享給朋友或學習小組，尋求同儕反饋。</li>
            <li><strong>發音歷史記錄：</strong> 系統會追蹤並可視化用戶在特定單詞或音素上的進步軌跡，讓成長一目了然。</li>
          </ul>
          <p>這堅實的技術基礎，使我們能夠將融資完全集中在市場拓展和用戶增長上，大大降低了投資風險。</p>

          <h3>2.2. 核心技術與學習方法論</h3>
          <h4>2.2.1. 基礎技術架構</h4>
          <p>nicetone.ai 的技術基石是微軟 Azure 語音服務與我們自主研發的 AI 演算法的深度整合。</p>
          <h4>2.2.2. 四維度評估引擎</h4>
          <p>我們的平台超越傳統的二元判斷，從準確度、流暢度、完整度和韻律四個維度評分。</p>
          <h4>2.2.3. 核心學習循環</h4>
          <p>用戶遵循一個高效的循環：AI語音評估 → 識別發音錯誤 → 生成個人化練習語料 → 重新評估。</p>

          <h3>2.3. 次世代職業社交學習生態系統</h3>
          <h4>2.3.1. 雙軌道個人化內容引擎</h4>
          <p>提供「語言認證衝刺軌道」（涵蓋PTE、IELTS、JLPT等多種考試）和「職業模擬軌道」，兼顧短期考試與長期職場需求。</p>
          <h4>2.3.2. Connect & Collaborate 社交中心</h4>
          <p>透過「專業學習小組」和「問個前輩」功能，將孤獨學習變為社群協作。</p>
          <h4>2.3.3. Tone Currency 經濟體系</h4>
          <p>以「學習即賺取」的遊戲化機制，驅動用戶深度參與。</p>
        </section>

        <section id="learning-flowchart">
          <h2>學習流程圖</h2>
          <MermaidFlowChart isEnglish={false} />
        </section>

        <section id="market-opportunity">
          <h2>3.0 澳洲的機遇：一個完美的創新生態系統</h2>
          
          <h3>3.1. 市場分析：一個高增長的環境</h3>
          <h4>3.1.1. 市場規模與預測</h4>
          <p>儘管我們的願景是全球性的，但以澳洲作為起點，將使 nicetone.ai 進入一個規模龐大且充滿活力的市場。數據顯示，澳洲的數位學習領域正經歷前所未有的增長。</p>
          
          <div className="table-container">
            <p className="table-title">表 1: 澳洲教育科技與語言學習市場預測 (2024-2033)</p>
            <table>
              <thead>
                <tr>
                  <th>市場區隔</th>
                  <th>2024年市場規模 (澳元)</th>
                  <th>2033年預測 (澳元)</th>
                  <th>年複合增長率 (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>線上語言學習</td>
                  <td>~$4.87 億</td>
                  <td>~$32 億</td>
                  <td>21.6%</td>
                </tr>
                <tr>
                  <td>電子學習</td>
                  <td>~$102 億</td>
                  <td>~$279 億</td>
                  <td>11.7%</td>
                </tr>
                <tr>
                  <td>教育科技</td>
                  <td>~$58.5 億</td>
                  <td>~$111 億</td>
                  <td>7.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>這些數據清晰地表明，nicetone.ai 在澳洲的初始賽道不僅規模可觀，更具備驚人的增長潛力。特別是線上語言學習市場高達 21.6% 的年複合增長率，為我們的快速擴張提供了堅實的市場基礎。</p>

          <h4>3.1.2. 關鍵市場驅動力</h4>
          <ul>
            <li><strong>移民與國際流動：</strong> 2023年，淨海外移民為澳洲增加了 51.8 萬人口。這一人群對英語學習的需求是剛性的、非自由裁量的，構成了我們最核心的初始用戶基礎。</li>
            <li><strong>技術整合：</strong> 市場正由 AI、個人化學習和行動裝置普及等趨勢驅動。nicetone.ai 的技術架構與產品理念完全順應了這一潮流。</li>
            <li><strong>政府支持：</strong> 澳洲政府的資金投入和戰略計畫正在積極推動教育科技的普及與應用，為我們的 B2B 業務創造了有利的政策環境。</li>
          </ul>

          <h3>3.2. 目標受眾畫像：高風險專業人士 (The High-Stakes Professional)</h3>
          <p>我們的市場進入策略精準鎖定那些職業成功與語言能力直接掛鉤的群體。他們的需求不僅急迫，而且是多層次的。一個典型的初始用戶畫像如下：</p>
          <ul>
            <li><strong>案例說明：</strong> 一位來自印度的軟體工程師，已獲得澳洲技術移民邀請。他需要在短期內通過PTE考試以滿足簽證要求，同時他更擔心自己未來在澳洲科技公司的工作中，無法順利參與快節奏的團隊討論和客戶溝通。</li>
            <li><strong>痛點分析：</strong> 他需要一個平台，既能高效幫助他通過PTE，又能讓他模擬練習「每日站會」、「產品需求評審」等工作場景的英語。nicetone.ai 正是為解決這類從「通過考試」到「勝任工作」的關鍵鴻溝而設計的。</li>
          </ul>

          <h3>3.3. 競爭格局與 nicetone.ai 的差異化優勢</h3>
          <h4>主要競爭者分析：</h4>
          <ul>
            <li><strong>通用語言App (Duolingo, Busuu)：</strong> 娛樂性強，但對於高難度的專業考試和職業英語來說，內容深度和針對性嚴重不足。</li>
            <li><strong>單一考試備考平台 (如 E2 Language, PTE Magic)：</strong> 專注於應試技巧，但完全忽略了用戶在通過考試後的實際工作需求，缺乏長期使用價值。</li>
            <li><strong>企業語言培訓方案 (如 Go-Fluent)：</strong> 價格高昂，通常只面向企業客戶，且缺乏驅動個人學習的遊戲化和社交元素。</li>
          </ul>
          <h4>nicetone.ai 堅不可摧的護城河：</h4>
          <p>我們的護城河在於<strong>「整合」。我們是市面上唯一一個將多種語言的高效備考、真實職業場景模擬和強大社交網絡融為一體</strong>的平台。用戶一旦進入我們的生態系統，就能一站式解決從備考到入職的所有語言和社交挑戰，這種高度的便利性和實用性是任何單一功能競爭對手都無法比擬的。</p>
        </section>

        <section id="strategic-fit">
          <h2>4.0 戰略契合：為何選擇國家創新簽證 (Subclass 858)</h2>
          
          <h3>4.1. 滿足企業家類別的核心要求</h3>
          <ul>
            <li><strong>卓越成就與國際認可：</strong> 我們的核心創新是「整合式職業賦能生態系統」。我們已上線運營的產品本身，就是一項卓越的技術成就，代表了在教育科技領域解決複雜現實問題的前瞻性思維。</li>
            <li><strong>目標領域的領導者：</strong> nicetone.ai 明確屬於澳洲政府重點發展的「教育科技 (EdTech)」和「數位科技 (DigiTech)」目標領域。創辦人王意騏先生作為此創新模式的推動者，正引領 nicetone.ai 成為該領域一顆崛起的新星與開創性的力量。</li>
            <li><strong>對澳洲的資產：</strong> nicetone.ai 將為澳洲帶來巨大價值。我們直接解決了技術移民的就業與融入障礙，為醫療、工程等關鍵行業輸送溝通能力更強的專業人才，從而提升整個社會的服務品質與生產力。</li>
          </ul>

          <h3>4.2. 與澳洲國家創新生態系統的戰略對齊</h3>
          <ul>
            <li><strong>響應 AI 與數位技能的國家優先級：</strong> 澳洲政府與科技產業已明確將 AI 的推廣應用與解決數位技能短缺問題列為國家級政策優先事項。nicetone.ai 正是這一國家戰略的具體實踐，直接提升了澳洲最需要的技術人才的關鍵軟技能。</li>
            <li><strong>支持技術移民成功融入：</strong> 一個成功的移民計畫不僅在於引進人才，更在於讓人才能夠快速發揮其專業價值。nicetone.ai 提供的正是一個加速器，幫助新澳洲人克服最後一哩的溝通障礙，為澳洲經濟做出實質貢獻。</li>
            <li><strong>支持數位經濟戰略：</strong> nicetone.ai 的商業模式——以SaaS訂閱為基礎、高可擴展性、具備全球競爭力——使其成為澳洲數位經濟戰略旨在吸引的典範企業。</li>
          </ul>
        </section>

        <section id="market-entry">
          <h2>5.0 市場進入策略與營運規劃</h2>
          
          <h3>5.1. 澳洲市場進入與增長策略</h3>
          <p>我們的市場擴張將分階段進行，從建立灘頭堡到生態系統擴張，最終走向全球。</p>
          <h4>第一階段：建立灘頭堡（第一年）</h4>
          <p><strong>目標客群與渠道：</strong> 我們的初期市場策略將聚焦於高需求的技術移民群體。雖然來自菲律賓、印度、尼泊爾等國家的醫療保健專業人士是我們的首要目標範例，但我們的數位行銷活動將更為廣泛。我們將針對各主要移民來源國的專業人士，在相關的線上社群、職業論壇（如護理、工程、IT、會計）以及PTE、IELTS等語言備考群組中進行精準投放。這種策略兼顧了靶向的效率與市場的廣度。</p>
          <h4>第二階段：B2B 與生態系統擴張（第二至三年）</h4>
          <p><strong>B2B 市場：</strong> 積極向澳洲本地企業、醫院、老年護理機構和科技公司推廣我們的B2B解決方案，用於培訓和提升其現有海外背景員工的溝通效率和文化適應能力。</p>
          <p><strong>API 整合：</strong> 為澳洲的學習管理系統（LMS）提供者提供標準化的 API 接口，使他們能夠無縫整合我們的發音評估和角色扮演功能。</p>
          <h4>第三階段：全球擴張（第四至五年）</h4>
          <p>利用在澳洲市場驗證成功的商業模式和品牌聲譽，作為進軍其他主要英語系國家市場（如加拿大、英國、美國）及其他語種市場的跳板，服務於全球的學習者社群。</p>

          <h3>5.2. 整合式變現框架</h3>
          <p>我們的財務模型具備高度的韌性與盈利潛力，其核心在於多元化且協同的收入流。</p>
          <h4>主要收入來源 (B2C)：Freemium 訂閱</h4>
          <ul>
            <li><strong>免費版：</strong> 提供有限的備考練習和基礎的職業場景，以吸引大量用戶。</li>
            <li><strong>高級版 (Premium Tier, 預計每月 25 澳元)：</strong> 提供無限量的備考練習與全真模擬考試、解鎖所有高級職業場景、AI深度發音分析報告、以及參與「問個前輩」導師計畫的資格。</li>
          </ul>
          <h4>次要收入來源</h4>
          <ul>
            <li><strong>B2B 企業解決方案：</strong> 根據企業規模和使用人數，提供包含管理後台和數據報告的定制化年度培訓套餐。</li>
            <li><strong>教育 API 授權：</strong> 按學生人頭和月份收取費用，供第三方學習平台整合。</li>
            <li><strong>白牌授權 (White Label)：</strong> 將我們的核心技術授權給其他教育公司，由他們以自己的品牌進行銷售。</li>
          </ul>
        </section>

        <section id="financials">
          <h2>6.0 財務預測與融資需求</h2>
          
          <h3>6.1. 收入與增長預測（五年展望）</h3>
          <h4>6.1.1. 關鍵假設</h4>
          <ul>
            <li>用戶年增長率：25%</li>
            <li>活躍用戶中的付費轉化率（Freemium）：從初期的 5% 穩定增長至 15%。</li>
            <li>每位付費B2C用戶平均年收入 (ARPU)：300 澳元。</li>
            <li>B2B業務從第二年開始貢獻收入，並逐年增長。</li>
          </ul>

          <h4>6.1.2. 收入與利潤預測</h4>
          <div className="table-container">
            <p className="table-title">表 2: 五年財務預測摘要 (單位：百萬澳元)</p>
            <table>
              <thead>
                <tr>
                  <th>財政年度</th>
                  <th>第 1 年</th>
                  <th>第 2 年</th>
                  <th>第 3 年</th>
                  <th>第 4 年</th>
                  <th>第 5 年</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>總營收</td>
                  <td>$0.8</td>
                  <td>$3.5</td>
                  <td>$9.2</td>
                  <td>$21.0</td>
                  <td>$45.0</td>
                </tr>
                <tr>
                  <td>訂閱 (B2C)</td>
                  <td>$0.8</td>
                  <td>$2.5</td>
                  <td>$6.0</td>
                  <td>$12.0</td>
                  <td>$25.0</td>
                </tr>
                <tr>
                  <td>企業方案 (B2B)</td>
                  <td>$0.0</td>
                  <td>$1.0</td>
                  <td>$3.2</td>
                  <td>$9.0</td>
                  <td>$20.0</td>
                </tr>
                <tr>
                  <td>總成本</td>
                  <td>$1.5</td>
                  <td>$2.8</td>
                  <td>$5.5</td>
                  <td>$10.5</td>
                  <td>$20.0</td>
                </tr>
                <tr>
                  <td>平台與雲端成本</td>
                  <td>$0.3</td>
                  <td>$0.6</td>
                  <td>$1.2</td>
                  <td>$2.5</td>
                  <td>$5.0</td>
                </tr>
                <tr>
                  <td>薪資與營運 (澳洲)</td>
                  <td>$0.7</td>
                  <td>$1.2</td>
                  <td>$2.5</td>
                  <td>$4.5</td>
                  <td>$8.0</td>
                </tr>
                <tr>
                  <td>銷售與市場行銷</td>
                  <td>$0.5</td>
                  <td>$1.0</td>
                  <td>$1.8</td>
                  <td>$3.5</td>
                  <td>$7.0</td>
                </tr>
                <tr>
                  <td>淨利潤/虧損</td>
                  <td>($0.7)</td>
                  <td>$0.7</td>
                  <td>$3.7</td>
                  <td>$10.5</td>
                  <td>$25.0</td>
                </tr>
                <tr>
                  <td>淨利率 (%)</td>
                  <td>N/A</td>
                  <td>20%</td>
                  <td>40%</td>
                  <td>50%</td>
                  <td>56%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>6.2. 資金用途與資本計畫</h3>
          <h4>6.2.1. 融資需求</h4>
          <p>為實現上述增長目標，nicetone.ai 尋求總額為 <strong>750 萬澳元</strong> 的種子輪融資。</p>

          <h4>6.2.2. 種子輪融資用途</h4>
          <p>首筆資金將嚴格用於澳洲市場的擴張和產品深化，而非從零開始的開發。</p>
          <div className="table-container">
            <p className="table-title">表 3: 種子輪融資用途</p>
            <table>
              <thead>
                <tr>
                  <th>類別</th>
                  <th>分配比例 (%)</th>
                  <th>金額 (澳元)</th>
                  <th>目的</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>產品與內容深化</td>
                  <td>40%</td>
                  <td>$3,000,000</td>
                  <td>基於已上線的產品，擴充職業模擬場景庫（如工程、IT），開發新語種內容，並完善社交與遊戲化功能。</td>
                </tr>
                <tr>
                  <td>市場行銷與社群建立</td>
                  <td>30%</td>
                  <td>$2,250,000</td>
                  <td>針對澳洲目標市場的全面數位行銷、合作夥伴關係建立和品牌推廣。</td>
                </tr>
                <tr>
                  <td>營運與人事 (澳洲)</td>
                  <td>20%</td>
                  <td>$1,500,000</td>
                  <td>支付澳洲辦公室租賃、首批本地員工（市場、運營）薪資及開銷。</td>
                </tr>
                <tr>
                  <td>法務與行政</td>
                  <td>10%</td>
                  <td>$750,000</td>
                  <td>公司註冊、知識產權保護、會計與法務等行政費用。</td>
                </tr>
                <tr>
                  <td><strong>總計</strong></td>
                  <td><strong>100%</strong></td>
                  <td><strong>$7,500,000</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>6.3. 盈利能力與投資分析</h3>
          <h4>6.3.1. 盈利路徑</h4>
          <p>如財務預測所示，公司預計在營運的第一年將處於戰略性虧損階段，主要由於在市場進入和用戶獲取方面的大力投入。從第二年開始，隨著付費訂閱用戶群的穩固增長和B2B業務的啟動，公司將實現健康的盈利，並在此後持續擴大其利潤率。</p>
          <h4>6.3.2. 投資回報 (ROI)</h4>
          <p>本專案為早期投資者提供了極具吸引力的潛在回報。相較於單純的工具型App，我們的生態系統模型能建立更高的用戶忠誠度和更長的生命週期價值(LTV)。這種可持續、高黏著度的商業模式，預示著強勁的長期增長潛力和穩健的投資回報。</p>
          <h4>6.3.3. 估值</h4>
          <p>基於市場可比公司、我們獨有的「整合式職業賦能」模式、已上線的產品以及明確的市場需求，我們對 nicetone.ai 的種子輪前估值為 <strong>1500 萬澳元</strong>。</p>
        </section>

        <section id="conclusion">
          <h2>7.0 結論與行動呼籲</h2>
          <p>nicetone.ai 不僅僅是一個語言學習App，它是一個為解決全球學習者在跨文化融合中所面臨核心挑戰的創新生態系統。我們巧妙地將多種語言的高效考試準備、實用的職業培訓和充滿支持的社交網絡結合在一起，並且已經將此願景轉化為一個在全球市場上線運營的產品。</p>
          <p>我們選擇澳洲作為全球啟動的基地和總部，是基於對其市場潛力、人才儲備和政策環境的深度信心。nicetone.ai 的成功，將直接為澳洲帶來顯著的社會與經濟效益。</p>
          <p>我們誠摯地提交此商業計畫書，以申請國家創新簽證（子類別 858）。我們堅信，在創辦人王意騏先生的領導下，nicetone.ai 將成為賦能數十萬全球公民成功的關鍵工具，並從澳洲出發，成長為一個在全球舞台上展現澳洲創新實力的典範企業。</p>
        </section>
      </main>
    </div>
  </div>
  );
};

export default PitchDetailsV2;
