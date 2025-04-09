document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("publishVariants", async (event) => {
    const publishedData = event.detail;

    console.log("Publishing Variants:", publishedData);
    
    try {
      // Now that we enabled CORS, the backend will allow this request
      const response = await fetch('http://localhost:3000/addmetafieldentry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishedData),
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
