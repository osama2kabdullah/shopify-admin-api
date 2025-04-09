document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("publishVariants", async (event) => {
    const publishedData = event.detail;

    console.log("Publishing Variants:", publishedData);

    const productId = publishedData.productId; // Extract productId from event data

    try {
      // Now that we enabled CORS, the backend will allow this request
      const response = await fetch('http://localhost:3000/api/fetchProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Fetched Product:', data.product);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error while fetching product:', error);
    }
  });
});
