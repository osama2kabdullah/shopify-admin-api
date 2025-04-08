document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("publishVariants", (event) => {
    const publishedData = event.detail;

    // Do whatever you need — for now just log it
    console.log("Publishing Variants:", publishedData);

    // Example: POST to server
    // fetch("/api/publish", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify(publishedData)
    // });
  });
});
