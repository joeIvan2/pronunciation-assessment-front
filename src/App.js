import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PronunciationAssessment from "./pages/PronunciationAssessment";
import Landing from "./pages/Landing";
import ErrorBoundary from "./components/ErrorBoundary";
import FirestoreErrorHandler from "./components/FirestoreErrorHandler";
import Footer from "./components/Footer";
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <FirestoreErrorHandler>
        <Router>
          <div className="App">
            <div className="app-content">
              <Routes>
                <Route path="/" element={<PronunciationAssessment />} />
                <Route path="/intro" element={<Landing />} />
                <Route path="/practice/:slug" element={<PronunciationAssessment />} />
                {/* 處理Firebase認證iframe和其他路徑 */}
                <Route path="/__/*" element={<div></div>} />
                <Route path="*" element={<PronunciationAssessment />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </FirestoreErrorHandler>
    </ErrorBoundary>
  );
}

export default App;
