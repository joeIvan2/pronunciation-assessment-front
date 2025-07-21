import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import PronunciationAssessment from "./pages/PronunciationAssessment";
import Landing from "./pages/Landing";
import Pitch from "./pages/Pitch";
import PitchDetails from "./pages/PitchDetails";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import DataDeletionPage from "./pages/DataDeletionPage";
import ErrorBoundary from "./components/ErrorBoundary";
import FirestoreErrorHandler from "./components/FirestoreErrorHandler";
import Footer from "./components/Footer";
import './App.css';

function AppContent() {
  const location = useLocation();
  const isPrivacyPage = location.pathname === '/privacy';
  const isDataDeletionPage = location.pathname === '/data-deletion';
  const shouldHideFooter = isPrivacyPage || isDataDeletionPage;

  return (
    <div className="App">
      <div className="app-content">
        <Routes>
          <Route path="/" element={<PronunciationAssessment />} />
          <Route path="/intro" element={<Landing />} />
          <Route path="/intro-en" element={<Landing />} />
          <Route path="/pitch" element={<Pitch />} />
          <Route path="/pitch-en" element={<Pitch />} />
          <Route path="/pitch-details" element={<PitchDetails />} />
          <Route path="/pitch-details-en" element={<PitchDetails />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />
          <Route path="/practice/:slug" element={<PronunciationAssessment />} />
          {/* 處理Firebase認證iframe和其他路徑 */}
          <Route path="/__/*" element={<div></div>} />
          <Route path="*" element={<PronunciationAssessment />} />
        </Routes>
      </div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <FirestoreErrorHandler>
        <Router>
          <AppContent />
        </Router>
      </FirestoreErrorHandler>
    </ErrorBoundary>
  );
}

export default App;
