import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PronunciationAssessment from "./pages/PronunciationAssessment";
import Landing from "./pages/Landing";
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PronunciationAssessment />} />
          <Route path="/intro" element={<Landing />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
