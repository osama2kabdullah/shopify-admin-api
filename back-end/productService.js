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

// Update Product Metafield
const updateProductMetafield = async (productId, metaobjectIds) => {
  const query = `
    mutation {
      metafieldsSet(metafields: [
        {
          namespace: "custom",
          key: "variants",
          ownerId: "gid://shopify/Product/${productId}",
          type: "list.metaobject_reference",
          value: "[${metaobjectIds.map(id => `\\"${id}\\"`).join(',')}]"
        }
      ]) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const response = await makeShopifyApiRequest(query);
  if (response?.data?.metafieldsSet?.userErrors?.length) {
    console.error(response.data.metafieldsSet, {query});
    throw new Error('Error while updating product metafield');
  }
  const updatedMetafield = response?.data?.metafieldsSet?.metafields;
  return updatedMetafield;
};

const createVariantMetaobject = async (variant) => {
  const fields = [
    { key: "variant", value: `gid://shopify/ProductVariant/${variant.variantId}` },
    { key: "image", value: `gid://shopify/MediaImage/${variant.image}` },
    { key: "options_combination", value: JSON.stringify(variant.values) }
  ];
  const query = `
    mutation {
      metaobjectCreate(metaobject: {
        type: "variant",
        capabilities: {
          publishable: {
            status: ACTIVE
          }
        },
        fields: ${JSON.stringify(fields).replace(/"([^"]+)":/g, '$1:')}
      }) {
        metaobject {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await makeShopifyApiRequest(query);
  if (response?.data?.metaobjectCreate?.userErrors?.length) {
    console.error(response.data.metaobjectCreate, {query});
    throw new Error('Error while creating metaobject');
  }

  const createdMetaobject = response?.data?.metaobjectCreate?.metaobject;
  return createdMetaobject.id;
};

const findOrCreateValues = async ({ values }) => {
  const ids = [];
  const query = `
    query {
      metaobjects(first: 100, type: "option_values") {
        edges {
          node {
            id
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;
  const response = await makeShopifyApiRequest(query);
  const dataFields = response?.data?.metaobjects?.edges.filter(edge => {
    const value = edge.node.fields.find(field => field.key === 'option')?.value;
    if (values.includes(value)) {
      ids.push({id: edge.node.id, value: value}); // Push the id into the ids array
      return true;
    }
    return false;
  });

  const existingValues = dataFields.map(edge => edge.node.fields.find(field => field.key === 'option')?.value);
  const missingValues = values.filter(value => !existingValues.includes(value));
  for (const value of missingValues) {
    const mutation = `
      mutation {
        metaobjectCreate(metaobject: {
          type: "option_values",
          capabilities: {
            publishable: {
              status: ACTIVE
            }
          },
          fields: [
            { key: "option", value: "${value}" }
          ]
        }) {
          metaobject {
            id
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const createRes = await makeShopifyApiRequest(mutation);
    const created = createRes?.data?.metaobjectCreate?.metaobject; 
    if (created) {
      ids.push({id: created.id, value: value});
    }
  }
  return ids;
}

const processVariants = async (variants) => {
  const metaobjectIds = [];
  const uniqueValues = [...new Set(variants.flatMap(item => item.values))];
  const values_ids = await findOrCreateValues({ values: uniqueValues });
  variants.forEach(variant => {
    variant.values = variant.values.map(value => {
      const matched = values_ids.find(item => item.value === value);
      return matched ? matched.id : value;
    });
  });
  for (const variant of variants) {
    const metaobjectId = await createVariantMetaobject(variant);
    if (metaobjectId) {
      metaobjectIds.push(metaobjectId);
    }
  }
  return metaobjectIds;
};

const addmetafieldentry = async (productId, variants) => {
  const metaobjectIds = await processVariants(variants);
  const updated = await updateProductMetafield(productId, metaobjectIds);
  return {
    success: true,
    metaobjectIds,
    metafieldUpdated: updated,
  };
};

module.exports = { addmetafieldentry };
