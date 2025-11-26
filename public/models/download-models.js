/**
 * Script to download face-api.js models
 * Run this in browser console or use node to download models
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
const MODELS_DIR = path.join(__dirname, 'models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1'
];

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

models.forEach(model => {
  const url = MODEL_URL + model;
  const filePath = path.join(MODELS_DIR, model);
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded: ${model}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${model}:`, err.message);
  });
});

// Alternatively, use CDN in faceVerificationService.ts:
// const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

