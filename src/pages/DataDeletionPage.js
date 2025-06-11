import React from 'react';
import { Link } from 'react-router-dom';
import './styles/PrivacyPolicyPage.css'; // 使用相同的樣式

const DataDeletionPage = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            回到首頁
          </Link>
          <h1>Facebook 資料刪除說明</h1>
          <p className="last-updated">Data Deletion Instructions</p>
        </div>

        <div className="privacy-content">
          <section className="policy-section">
            <h2>中文版說明</h2>
            
            <div className="subsection">
              <h3>如何刪除您的資料</h3>
              <p>
                如果您希望刪除您透過 Facebook 登入 NiceTone 所產生的所有資料，請按照以下步驟操作：
              </p>
              <ol>
                <li>發送電子郵件至：<strong>info@nicetone.ai</strong></li>
                <li>在郵件主旨中註明：<strong>「Facebook 資料刪除請求」</strong></li>
                <li>在郵件內容中提供您的 <strong>Facebook 用戶 ID</strong></li>
                <li>我們將於 <strong>7 個工作天內</strong>完成資料刪除處理</li>
                <li>刪除完成後，我們會寄送確認郵件給您</li>
              </ol>
            </div>

            <div className="subsection">
              <h3>如何找到您的 Facebook 用戶 ID</h3>
              <ol>
                <li>前往 Facebook 並登入您的帳號</li>
                <li>點擊右上角的個人資料圖片</li>
                <li>選擇「設定和隱私」→「設定」</li>
                <li>在左側選單中點擊「您的 Facebook 資訊」</li>
                <li>複製您的用戶 ID 號碼</li>
              </ol>
            </div>

            <div className="subsection">
              <h3>將被刪除的資料</h3>
              <ul>
                <li>您的基本個人資料（姓名、電子郵件）</li>
                <li>學習記錄和收藏句子</li>
                <li>自定義標籤和設定</li>
                <li>分享記錄和歷史資料</li>
                <li>所有與您帳號相關的雲端儲存資料</li>
              </ul>
              <p><strong>注意：</strong>資料刪除後無法復原，請謹慎考慮。</p>
            </div>
          </section>

          <section className="policy-section">
            <h2>English Version</h2>
            
            <div className="subsection">
              <h3>How to Delete Your Data</h3>
              <p>
                If you want to delete all data generated through Facebook login to NiceTone, please follow these steps:
              </p>
              <ol>
                <li>Send an email to: <strong>info@nicetone.ai</strong></li>
                <li>Subject line: <strong>"Facebook Data Deletion Request"</strong></li>
                <li>Include your <strong>Facebook User ID</strong> in the email content</li>
                <li>We will complete the data deletion within <strong>7 business days</strong></li>
                <li>You will receive a confirmation email once deletion is complete</li>
              </ol>
            </div>

            <div className="subsection">
              <h3>How to Find Your Facebook User ID</h3>
              <ol>
                <li>Go to Facebook and log into your account</li>
                <li>Click on your profile picture in the top right</li>
                <li>Select "Settings & Privacy" → "Settings"</li>
                <li>Click "Your Facebook Information" in the left menu</li>
                <li>Copy your User ID number</li>
              </ol>
            </div>

            <div className="subsection">
              <h3>Data to be Deleted</h3>
              <ul>
                <li>Your basic profile information (name, email)</li>
                <li>Learning records and favorite sentences</li>
                <li>Custom tags and settings</li>
                <li>Share history and historical data</li>
                <li>All cloud storage data associated with your account</li>
              </ul>
              <p><strong>Note:</strong> Data deletion is irreversible. Please consider carefully.</p>
            </div>
          </section>

          <section className="policy-section">
            <h2>聯絡資訊 / Contact Information</h2>
            <div className="contact-info">
              <p>
                如有任何疑問，請聯絡我們：<br/>
                For any questions, please contact us:
              </p>
              <ul>
                <li><strong>電子郵件 / Email</strong>：<a href="mailto:info@nicetone.ai">info@nicetone.ai</a></li>
                <li><strong>網站 / Website</strong>：<a href="https://nicetone.ai" target="_blank" rel="noopener noreferrer">https://nicetone.ai</a></li>
              </ul>
              <p>
                處理時間：7 個工作天<br/>
                Processing time: 7 business days
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage; 