document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;

      tabButtons.forEach(btn =>
        btn.classList.toggle("active", btn.dataset.tab === targetTab)
      );

      tabContents.forEach(content =>
        content.classList.toggle("active", content.dataset.tab === targetTab)
      );
    });
  });
});
