require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the CORS middleware
const bodyParser = require('body-parser');
const { addmetafieldentry } = require('./productService'); // Assuming you have this logic

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 or use .env

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Define the route to fetch product by ID (POST)
app.post('/addmetafieldentry', async (req, res) => {
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
