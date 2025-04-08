require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the CORS middleware
const bodyParser = require('body-parser');
const { fetchProductById } = require('./productService'); // Assuming you have this logic

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 or use .env

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Define the route to fetch product by ID (POST)
app.post('/api/fetchProduct', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await fetchProductById(productId);
    if (product) {
      res.status(200).json({ product });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
