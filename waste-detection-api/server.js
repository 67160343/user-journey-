const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route สำหรับทดสอบสถานะระบบ
app.get('/', (req, res) => {
  res.json({
    message: 'Waste Detection REST API is running!',
    status: 'Online',
    timestamp: new Date()
  });
});

// Mockup Authentication Routes ตัวอย่าง
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    return res.json({
      status: 'success',
      token: 'mock-jwt-token-xyz123',
      user: { id: 1, username: 'admin', role: 'operator' }
    });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// Mockup Detection Prediction Endpoint ตัวอย่าง
app.post('/api/v1/detections/predict', (req, res) => {
  res.json({
    status: 'success',
    data: {
      detected_class: 'Plastic_Bottle',
      confidence: 96.8,
      bbox: [30, 40, 70, 70],
      assigned_bin: 'Recyclable',
      bin_color: '#2563eb',
      inference_time_ms: 18.45
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});