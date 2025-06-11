import React from 'react';
import { Link } from 'react-router-dom';
import './styles/PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            回到首頁
          </Link>
          <h1>隱私政策與免責聲明</h1>
          <p className="last-updated">最後更新：2024年12月</p>
        </div>

        <div className="privacy-content">
          <section className="policy-section">
            <h2>隱私政策</h2>
            
            <div className="subsection">
              <h3>1. 資料收集與使用</h3>
              <p>
                NiceTone 致力於保護您的隱私。我們收集的資料僅用於提供和改善我們的服務。
              </p>
              <ul>
                <li><strong>個人資料</strong>：透過 Google 或 Facebook 登入時，我們會收集您的姓名、電子郵件地址等基本資料</li>
                <li><strong>學習資料</strong>：包括您的收藏句子、自定義標籤、學習記錄等</li>
                <li><strong>技術資料</strong>：IP 地址、瀏覽器類型、裝置資訊等，用於改善服務體驗</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>2. 資料儲存與安全</h3>
              <ul>
                <li>所有資料均使用 Firebase 雲端服務安全儲存</li>
                <li>採用業界標準的加密技術保護您的資料</li>
                <li>定期備份以防止資料遺失</li>
                <li>嚴格限制員工對用戶資料的存取權限</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>3. 資料分享</h3>
              <p>
                我們不會向第三方出售、交易或轉讓您的個人資料，除非：
              </p>
              <ul>
                <li>獲得您的明確同意</li>
                <li>法律要求或政府機關合法要求</li>
                <li>保護我們的權利、財產或安全</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>4. 您的權利（GDPR 合規）</h3>
              <p>如果您位於歐盟，您享有以下權利：</p>
              <ul>
                <li><strong>存取權</strong>：要求提供我們持有的您的個人資料副本</li>
                <li><strong>更正權</strong>：要求更正不準確或不完整的個人資料</li>
                <li><strong>刪除權</strong>：要求刪除您的個人資料</li>
                <li><strong>限制處理權</strong>：要求限制對您個人資料的處理</li>
                <li><strong>資料可攜權</strong>：要求以結構化、常用和機器可讀的格式獲得您的資料</li>
                <li><strong>反對權</strong>：反對處理您的個人資料</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>5. Cookie 政策</h3>
              <p>
                我們使用 Cookie 和類似技術來改善您的使用體驗：
              </p>
              <ul>
                <li><strong>必要 Cookie</strong>：維持網站基本功能</li>
                <li><strong>功能 Cookie</strong>：記住您的偏好設定</li>
                <li><strong>分析 Cookie</strong>：了解網站使用情況（Google Analytics）</li>
              </ul>
              <p>您可以通過瀏覽器設定控制 Cookie 的使用。</p>
            </div>
          </section>

          <section className="policy-section">
            <h2>免責聲明</h2>
            
            <div className="subsection">
              <h3>1. 服務性質</h3>
              <ul>
                <li>NiceTone 是一個英語學習輔助工具，不能替代專業的語言教學</li>
                <li>發音評分和建議僅供參考，實際學習效果因人而異</li>
                <li>我們不保證使用本服務能達到特定的學習成果</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>2. 技術限制</h3>
              <ul>
                <li>服務依賴第三方 API（Azure 語音服務、OpenAI 等），可能因技術問題暫時中斷</li>
                <li>語音識別準確度會因環境噪音、設備品質等因素影響</li>
                <li>不同瀏覽器和設備的兼容性可能有所差異</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>3. 內容責任</h3>
              <ul>
                <li>用戶自行上傳或輸入的內容需符合法律規範和社會道德</li>
                <li>我們不對用戶生成的內容負責</li>
                <li>保留移除不當內容的權利</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>4. 責任限制</h3>
              <p>
                在法律允許的最大範圍內，NiceTone 不對以下情況承擔責任：
              </p>
              <ul>
                <li>因使用或無法使用本服務而導致的任何直接、間接、偶然或後果性損失</li>
                <li>資料遺失、商業中斷或其他商業損失</li>
                <li>第三方服務的中斷或故障</li>
              </ul>
            </div>
          </section>

          <section className="policy-section">
            <h2>聯絡資訊</h2>
            <div className="contact-info">
              <p>
                如果您對我們的隱私政策有任何疑問，或希望行使您的資料權利，請聯絡我們：
              </p>
              <ul>
                <li><strong>電子郵件</strong>：info@nicetone.ai</li>
                <li><strong>網站</strong>：<a href="https://nicetone.ai" target="_blank" rel="noopener noreferrer">https://nicetone.ai</a></li>
              </ul>
              <p>
                我們將在收到您的請求後 30 天內回覆。
              </p>
            </div>
          </section>

          <section className="policy-section">
            <h2>政策變更</h2>
            <p>
              我們可能會不時更新這項隱私政策。重大變更時，我們會透過網站公告或電子郵件通知您。
              建議您定期查看此頁面以了解最新資訊。
            </p>
            <p>
              繼續使用我們的服務即表示您同意遵守更新後的政策。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 