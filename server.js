const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const SpeechSDK = require('microsoft-cognitiveservices-speech-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_REGION = process.env.AZURE_REGION;

app.post('/api/pronunciation', async (req, res) => {
  const { referenceText, audioBuffer } = req.body;
  if (!referenceText || !audioBuffer) {
    return res.status(400).json({ error: '缺少參數' });
  }
  try {
    const buffer = Buffer.from(audioBuffer, 'base64');
    const pushStream = SpeechSDK.AudioInputStream.createPushStream();
    pushStream.write(buffer);
    pushStream.close();
    const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechRecognitionLanguage = "en-US";
    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);
    recognizer.recognizeOnceAsync(result => {
      res.json({
        text: result.text,
        json: result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult)
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '處理請求時發生錯誤' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 