require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios'); // For making HTTP requests
const fs = require('fs'); // To log errors to a file (optional)

// Load environment variables
const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';

// Shopify API endpoint
const apiUrl = `${shopifyStoreUrl}/admin/api/${apiVersion}/graphql.json`;

// Log errors to a file for persistent tracking
const logErrorToFile = (error) => {
  const errorMessage = `[${new Date().toISOString()}] ${error}\n`;
  fs.appendFileSync('error.log', errorMessage);
};

// Create a function to handle all GraphQL requests
const makeShopifyApiRequest = async (query) => {
  try {
    const response = await axios.post(
      apiUrl,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Request Error:', error);
    logErrorToFile(error);
    throw new Error('Error while making Shopify API request');
  }
};

// Fetch Product by ID
const fetchProductById = async (productId) => {
  const query = `
    query {
      product(id: "gid://shopify/Product/${productId}") {
        id
        title
        variants(first: 5) {
          edges {
            node {
              id
              price
            }
          }
        }
      }
    }
  `;
  const result = await makeShopifyApiRequest(query);
  if (result.errors) {
    console.error('Error fetching product:', result.errors);
  } else {
    return result.data.product; // Return the fetched product data
  }
};

module.exports = { fetchProductById };
