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
    saveVariantsToLocalStorage(combinations); // ✅ Save
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

  function generateVariantMarkup(variant, saved = {}) {
    const variantText = variant.join(" / ");
    const variantId = `variant-${Math.random().toString(36).substr(2, 9)}`;

    return `
      <div class="variant-box" id="${variantId}">
        <h3>${variantText}</h3>
        <label>
          Image URL:
          <input type="text" form="variants-publish" required name="image-url" placeholder="Enter image URL" value="${saved.image || ""}" />
        </label>
        <br/>
        <label>
          Variant ID:
          <input type="text" form="variants-publish" required name="variant-id" placeholder="Enter variant ID" value="${saved.variantId || ""}" />
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

    const data = {
      variants: variantsData,
      productId: document.querySelector('input[name="product"]')?.value?.trim(),
      submitButton,
      spinner
    };

    const event = new CustomEvent("publishVariants", { detail: data });
    document.dispatchEvent(event);
  }

  function renderVariantsList(variants, savedVariants = []) {
    const variantTabContent = document.querySelector('.tab-content[data-tab="variants"]');

    if (!variantTabContent) return;

    if (variants.length === 0) {
      variantTabContent.innerHTML = "<p>No variants yet.</p>";
      return;
    }

    variantTabContent.innerHTML = "";

    const boxesHTML = variants.map(variant => {
      const existing = savedVariants.find(saved => saved.values.join(" / ") === variant.join(" / "));
      return generateVariantMarkup(variant, existing || {});
    }).join("");

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
      event.preventDefault();
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

        const updatedCount = document.querySelectorAll(".variant-box").length;
        updateVariantTab(updatedCount);

        saveCurrentVariants(); // ✅ Update saved data

        if (updatedCount === 0) {
          variantTabContent.innerHTML = "<p>No variants yet.</p>";
        }
      });
    });

    // ✅ Add live input change saving
    variantTabContent.querySelectorAll('.variant-box input').forEach(input => {
      input.addEventListener("input", saveCurrentVariants);
    });
  }

  // ✅ Save variants to localStorage
  function saveVariantsToLocalStorage(variantList) {
    const variantBoxes = variantList.map(values => ({
      values,
      image: "",
      variantId: ""
    }));
    localStorage.setItem("variantsData", JSON.stringify(variantBoxes));
  }

  // ✅ Save current user-edited variant input values
  function saveCurrentVariants() {
    const boxes = document.querySelectorAll(".variant-box");
    const data = Array.from(boxes).map(box => {
      return {
        values: box.querySelector("h3")?.textContent?.trim().split(" / ") || [],
        image: box.querySelector('input[name="image-url"]')?.value?.trim(),
        variantId: box.querySelector('input[name="variant-id"]')?.value?.trim()
      };
    });
    localStorage.setItem("variantsData", JSON.stringify(data));
  }

  // ✅ Load from localStorage if found
  function loadVariantsFromLocalStorage() {
    const saved = JSON.parse(localStorage.getItem("variantsData") || "[]");
    if (!saved.length) return;

    const variantsOnly = saved.map(v => v.values);
    renderVariantsList(variantsOnly, saved);
    updateVariantTab(variantsOnly.length);
  }

  // Init on load
  loadVariantsFromLocalStorage();
});