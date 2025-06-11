import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      lineHeight: '1.6',
      fontSize: '14px',
      color: '#374151'
    }}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>隱私政策與免責聲明</h1>
      <p style={{ marginBottom: '15px', fontSize: '12px', color: '#6b7280' }}>
        最後更新：2025年1月
      </p>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          1. 資料收集與使用
        </h2>
        <p style={{ marginBottom: '10px' }}>
          我們致力於保護您的個人隱私。當您使用本服務時，我們可能收集以下資訊：
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li>Google 帳戶基本資訊（姓名、電子郵件地址）</li>
          <li>語音錄音檔案（僅用於發音評估，不會永久儲存）</li>
          <li>學習記錄與收藏內容</li>
          <li>服務使用統計資料</li>
        </ul>
        <p style={{ marginBottom: '15px' }}>
          這些資訊僅用於提供與改善服務品質，不會用於商業推廣或與第三方分享。
        </p>
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeeba',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <strong style={{ color: '#856404' }}>使用者內容使用聲明：</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#856404' }}>
            經您明確同意後，我們可能將您創建的例句、標籤及學習內容（完全去除個人識別資訊）用於：
            <br />• 改善網站功能與服務品質
            <br />• 提升服務知名度與推廣
            <br />• 學術研究與語言學習資源開發
            <br /><strong>重要：</strong>此類使用需要您的主動同意，我們會在適當時機向您明確詢問授權。
            您隨時可以撤回此同意，且不影響其他服務功能的使用。
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          2. 資料保護措施
        </h2>
        <p style={{ marginBottom: '10px' }}>
          我們採用業界標準的安全措施保護您的資料：
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li>使用 HTTPS 加密傳輸</li>
          <li>Firebase 雲端資料庫安全儲存</li>
          <li>定期安全性更新與監控</li>
          <li>嚴格的存取權限控制</li>
        </ul>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          3. 免責聲明
        </h2>
        <p style={{ marginBottom: '15px' }}>
          儘管我們採取合理的安全措施保護您的個人資料，但在以下情況下，我們不承擔責任：
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li>因第三方惡意攻擊、駭客入侵或系統漏洞導致的資料外洩</li>
          <li>因不可抗力因素（如天災、戰爭、政府法令）造成的服務中斷或資料遺失</li>
          <li>因使用者自身疏失（如密碼外洩、設備遺失）導致的帳戶安全問題</li>
          <li>因網路環境、硬體設備故障等非本服務控制範圍內的因素</li>
        </ul>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          4. 您的權利（符合 GDPR 規範）
        </h2>
        <p style={{ marginBottom: '10px' }}>
          根據相關法規，您享有以下權利：
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li><strong>存取權：</strong>您可以要求查看我們持有的您的個人資料</li>
          <li><strong>更正權：</strong>您可以要求更正不正確的個人資料</li>
          <li><strong>刪除權：</strong>您可以要求刪除您的個人資料</li>
          <li><strong>可攜性權：</strong>您可以要求以機器可讀格式取得您的資料</li>
          <li><strong>反對權：</strong>您可以反對我們處理您的個人資料</li>
        </ul>
        <p>
          如需行使上述權利，請參考下方聯絡資訊。
        </p>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          5. 適用法律
        </h2>
        <p style={{ marginBottom: '15px' }}>
          本隱私政策遵循以下法律規範：
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li><strong>台灣：</strong>個人資料保護法</li>
          <li><strong>歐盟：</strong>一般資料保護規則 (GDPR)</li>
          <li><strong>美國：</strong>加州消費者隱私法 (CCPA) 及相關州法</li>
        </ul>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          6. Cookie 使用
        </h2>
        <p>
          本服務使用 Cookie 及類似技術來改善使用者體驗、記住您的偏好設定，並提供個人化服務。
          您可以透過瀏覽器設定管理 Cookie，但這可能影響某些功能的正常運作。
        </p>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          7. 聯絡資訊
        </h2>
        <p style={{ marginBottom: '10px' }}>
          如對本隱私政策有任何疑問，或需要行使您的個人資料權利，請聯絡我們：
        </p>
        <div style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <div style={{ marginBottom: '5px' }}>隱私相關事務：<a href="mailto:info@nicetone.ai" style={{ color: '#007AFF' }}>info@nicetone.ai</a></div>
          <div>一般聯絡：<a href="mailto:info@nicetone.ai" style={{ color: '#007AFF' }}>info@nicetone.ai</a></div>
        </div>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#007AFF' }}>
          8. 政策更新
        </h2>
        <p>
          我們可能會不定期更新本隱私政策。重大變更將會在網站上公告，建議您定期查閱本頁面以了解最新資訊。
        </p>
      </section>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: 'rgba(0, 122, 255, 0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(0, 122, 255, 0.3)'
      }}>
        <strong style={{ color: '#007AFF' }}>Beta 版本特別聲明：</strong>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
          本服務目前為 Beta 測試版本，功能與資料儲存的穩定性可能受到影響。
          我們建議您定期備份重要資料，並理解測試期間可能發生的資料遺失風險。
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 