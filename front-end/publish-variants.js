document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("publishVariants", async (event) => {
    const publishedData = event.detail;
    const appSecret = sessionStorage.getItem('appSecret');

    console.log("Publishing Variants:", publishedData);
    try {
      // Now that we enabled CORS, the backend will allow this request
      const response = await fetch('http://localhost:3000/api/addmetafieldentry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appSecret,
        },
        body: JSON.stringify({variants: publishedData.variants, productId: publishedData.productId}),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Metaobject created successfully:', data);
      } else {
        console.error('Error:', data.error);
      }
      publishedData.submitButton.disabled = false;
      publishedData.spinner.remove();
    } catch (error) {
      console.error('Error while fetching product:', error);
    }
  });
});
