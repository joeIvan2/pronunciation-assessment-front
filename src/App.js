import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PronunciationAssessment from "./pages/PronunciationAssessment";
import Landing from "./pages/Landing";
import ErrorBoundary from "./components/ErrorBoundary";
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<PronunciationAssessment />} />
            <Route path="/intro" element={<Landing />} />
            {/* 處理Firebase認證iframe和其他路徑 */}
            <Route path="/__/*" element={<div></div>} />
            <Route path="*" element={<PronunciationAssessment />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
