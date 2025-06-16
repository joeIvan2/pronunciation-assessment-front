# History Data Compression Guide

This document explains how pronunciation history records are stored in a compact format. Use this mapping when constructing prompts for the AI so it understands the meaning of each compressed field. The stored data uses short keys to reduce localStorage and Firestore usage.

## Compressed Record Structure
```json
{
  "a": "id",
  "b": "text",
  "c": 0,
  "d": 0,
  "e": 0,
  "f": 0,
  "g": 0,
  "h": "recognizedText",
  "i": [ /* compressed words */ ]
}
```

### Field Mapping
- `a` → `id`
- `b` → `text`
- `c` → `scoreAccuracy`
- `d` → `scoreFluency`
- `e` → `scoreCompleteness`
- `f` → `scorePronunciation`
- `g` → `timestamp`
- `h` → `recognizedText`
- `i` → `words` (array of compressed words)

### Compressed Word Structure
```json
{
  "w": "Word",
  "p": {
    "a": 0, // AccuracyScore
    "e": "ErrorType"
  },
  "m": [
    { "p": "Phoneme", "a": 0 }
  ]
}
```
- `w` → `Word`
- `p.a` → `PronunciationAssessment.AccuracyScore`
- `p.e` → `PronunciationAssessment.ErrorType`
- `m` → `Phonemes`
  - inside `m`, each object has:
    - `p` → `Phoneme`
    - `a` → `PronunciationAssessment.AccuracyScore`

## Usage Notes
- Send the compressed format to the AI to save bandwidth.
- Decompress fields using the above mapping when presenting the data.
- If a word or phoneme lacks a score, the corresponding accuracy fields may be omitted.
