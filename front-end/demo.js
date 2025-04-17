document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("product"); // ✅ Correct input field
    const searchBoxContainer = document.querySelector(".kimi-search-form");
  
    input.focus(); // ✅ Now this works
  
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        searchBoxContainer.classList.add("move-to-top");
      } else {
        searchBoxContainer.classList.remove("move-to-top");
      }
    });
  });
  
  