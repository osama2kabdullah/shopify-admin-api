require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the CORS middleware
const bodyParser = require('body-parser');
const { addmetafieldentry } = require('./productService'); // Assuming you have this logic

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 or use .env
const API_SECRET = process.env.FRONTEND_API_KEY;

// CORS for dev (optional)
const allowedOrigins = ['http://127.0.0.1:5500', 'https://osama2kabdullah.github.io'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Auth middleware
const apiAuthMiddleware = (req, res, next) => {
  const clientKey = req.headers['x-api-key'];
  if (!clientKey || clientKey !== API_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/verify', async (req, res) => {
  const { secret } = req.body;
  if (secret === API_SECRET) {
    return res.status(200).json({ verified: true });
  }
  return res.status(403).json({ verified: false });
});

// API Routes
app.post('/api/addmetafieldentry', apiAuthMiddleware, async (req, res) => {
  const { productId, variants } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const response = await addmetafieldentry(productId, variants);
    if (response.errors) {
      return res.status(400).json({ error: response.errors });
    }
    res.status(200).json({ message: 'Metaobject created successfully', data: response });
  } catch (error) {
    console.error('Error creating metaobject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', apiAuthMiddleware, (req, res) => {
  res.send('Hello World!, Develop by Osama Abdullah');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on PORT = ${port}`);
});
