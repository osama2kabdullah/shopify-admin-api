document.addEventListener("DOMContentLoaded", () => {
  const generateButton = document.getElementById("generate-variants");

  generateButton.addEventListener("click", () => {
    const allOptionGroups = document.querySelectorAll(".option-group");

    const optionValues = Array.from(allOptionGroups).map(group => {
      const inputs = group.querySelectorAll(".option-value input");
      return Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
    });

    if (optionValues.some(values => values.length === 0)) {
      alert("Each option group must have at least one non-empty value.");
      return;
    }

    const combinations = cartesianProduct(optionValues);

    updateVariantTab(combinations.length);
    renderVariantsList(combinations);
  });

  function cartesianProduct(arrays) {
    return arrays.reduce((acc, curr) => {
      return acc.flatMap(a => curr.map(b => [...a, b]));
    }, [[]]);
  }

  function updateVariantTab(count) {
    const variantTabButton = document.querySelector('.tab-button[data-tab="variants"]');
    if (variantTabButton) {
      variantTabButton.textContent = `Variants (${count})`;
    }
  }

  function generateVariantMarkup(variant) {
    const variantText = variant.join(" / ");
    const variantId = `variant-${Math.random().toString(36).substr(2, 9)}`;

    return `
      <div class="variant-box" id="${variantId}">
        <h3>${variantText}</h3>
        <label>
          Image URL:
          <input type="text" form="variants-publish" required name="image-url" placeholder="Enter image URL" />
        </label>
        <br/>
        <label>
          Variant ID:
          <input type="text" form="variants-publish" required name="variant-id" placeholder="Enter variant ID" />
        </label>
        <button class="delete-variant" data-target="${variantId}">X</button>
      </div>
    `;
  }

  function publishButtonClickHandler(submitButton, spinner) {
    const variantBoxes = document.querySelectorAll(".variant-box");

    const variantsData = Array.from(variantBoxes).map(box => {
      return {
        values: box.querySelector("h3")?.textContent?.trim().split(" / ") || [],
        image: box.querySelector('input[name="image-url"]')?.value?.trim(),
        variantId: box.querySelector('input[name="variant-id"]')?.value?.trim()
      };
    });

    const data = {variants: variantsData, productId: document.querySelector('input[name="product"]')?.value?.trim(), submitButton, spinner};

    // Dispatch custom event
    const event = new CustomEvent("publishVariants", { detail: data });
    document.dispatchEvent(event);
  }

  function renderVariantsList(variants) {
    const variantTabContent = document.querySelector('.tab-content[data-tab="variants"]');

    if (!variantTabContent) return;

    if (variants.length === 0) {
      variantTabContent.innerHTML = "<p>No variants yet.</p>";
      return;
    }

    variantTabContent.innerHTML = ""; // Clear previous content

    const boxesHTML = variants.map(generateVariantMarkup).join("");
    variantTabContent.innerHTML = boxesHTML;

    const form = document.createElement("form");
    form.className = "variants-form";
    form.id = "variants-publish";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Publish Variants";
    submitButton.className = "publish-variants";

    form.appendChild(submitButton);
    variantTabContent.appendChild(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent default form submission
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      spinner.textContent = "Loading...";
      submitButton.disabled = true;
      submitButton.appendChild(spinner);
      publishButtonClickHandler(submitButton, spinner);
    });

    // Activate delete buttons
    variantTabContent.querySelectorAll('.delete-variant').forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const targetBox = document.getElementById(targetId);
        if (targetBox) targetBox.remove();

        // Update the variant count
        const updatedCount = document.querySelectorAll(".variant-box").length;
        updateVariantTab(updatedCount);

        if (updatedCount === 0) {
          variantTabContent.innerHTML = "<p>No variants yet.</p>";
        }
      });
    });
  }
});