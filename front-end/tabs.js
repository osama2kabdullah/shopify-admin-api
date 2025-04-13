// detail-view.js
class DetailView extends HTMLElement {
  connectedCallback() {
    this.initMarkup();
    this.initTabs();
    this.initOptionGroupLogic();
    this.loadFromLocalStorage();
  }

  initMarkup() {
    this.innerHTML = `
      <div class="tabs">
        <div class="tab-buttons">
          <button class="tab-button active" data-tab="options">Option Groups</button>
          <button class="tab-button" data-tab="variants">Variants (0)</button>
        </div>
        <div class="tab-content active" data-tab="options">
          <div class="option-groups">
            <button class="add-option-group">+ create option group</button>
            <button id="generate-variants">Generate Variants</button>
          </div>
        </div>
        <div class="tab-content" data-tab="variants">
          <p>No variants yet.</p>
        </div>
      </div>
    `;
  }

  cartesianProduct(arrays) {
    return arrays.reduce((acc, curr) => {
      return acc.flatMap(a => curr.map(b => [...a, b]));
    }, [[]]);
  }
  
  updateVariantTab(count) {
    const variantTabButton = this.querySelector('.tab-button[data-tab="variants"]');
    if (variantTabButton) {
      variantTabButton.textContent = `Variants (${count})`;
    }
  }  

  initGenerateVariants() {
    const generateButton = this.querySelector("#generate-variants");
  
    generateButton.addEventListener("click", () => {
      const allOptionGroups = this.querySelectorAll(".option-group");
  
      const optionValues = Array.from(allOptionGroups).map(group => {
        const inputs = group.querySelectorAll(".option-value input");
        return Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
      });
  
      if (optionValues.some(values => values.length === 0)) {
        alert("Each option group must have at least one non-empty value.");
        return;
      }
  
      const combinations = this.cartesianProduct(optionValues);
  
      this.updateVariantTab(combinations.length);
      this.renderVariantsList(combinations);
      this.saveVariantsToLocalStorage(combinations);
    });
  }  

  initTabs() {
    const tabButtons = this.querySelectorAll(".tab-button");
    const tabContents = this.querySelectorAll(".tab-content");

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
  }

  initOptionGroupLogic() {
    const addOptionGroupButton = this.querySelector(".add-option-group");
    const container = this.querySelector(".option-groups");

    addOptionGroupButton.addEventListener("click", () => {
      const nextId = this.getNextGroupId();
      const newGroup = this.createOptionGroup(nextId);
      container.insertBefore(newGroup, addOptionGroupButton);
      this.saveToLocalStorage();
    });
  }

  getNextGroupId() {
    return this.querySelectorAll(".option-group").length + 1;
  }

  createOptionGroup(groupIndex, groupData = null) {
    const groupId = groupIndex;
    const wrapper = document.createElement("div");
    wrapper.classList.add("option-group");

    const valuesHTML = (groupData?.values || [""])
      .map((val, i) => this.createValueFieldHTML(groupId, i + 1, val))
      .join("");

    wrapper.innerHTML = `
      <h3>Option Group ${groupIndex}</h3>
      <label for="option-name-${groupId}">Option Name:</label>
      <input type="text" id="option-name-${groupId}" name="option-group" placeholder="Enter option group name" value="${groupData?.name || ""}" required>
      <br><br>
      <div class="option-values">
        ${valuesHTML}
      </div>
      <button class="add-value">+ add value</button>
      <button class="delete-option-group">X</button>
    `;

    wrapper.querySelector(".add-value").addEventListener("click", () => {
      this.addValue(wrapper, groupId);
      this.saveToLocalStorage();
    });

    wrapper.querySelector(".delete-option-group").addEventListener("click", () => {
      wrapper.remove();
      this.updateGroupHeaders();
      this.saveToLocalStorage();
    });

    wrapper.querySelector("input[name='option-group']").addEventListener("input", () => {
      this.saveToLocalStorage();
    });

    wrapper.querySelectorAll(".option-value").forEach(field => {
      const btn = field.querySelector(".delete-value");
      const input = field.querySelector("input");

      btn.addEventListener("click", (e) => {
        this.deleteValue(e.target, wrapper, groupId);
        this.saveToLocalStorage();
      });

      input.addEventListener("input", () => {
        this.saveToLocalStorage();
      });
    });

    return wrapper;
  }

  createValueFieldHTML(groupId, valueIndex, value = "") {
    return `
      <div class="option-value">
        <label for="option-value-${groupId}-${valueIndex}">Value ${valueIndex}:</label>
        <input type="text" id="option-value-${groupId}-${valueIndex}" name="option-value" value="${value}" placeholder="Enter option value" required>
        <button class="delete-value">X</button>
      </div>
    `;
  }

  addValue(group, groupId) {
    const container = group.querySelector(".option-values");
    const count = container.querySelectorAll(".option-value").length;
    const index = count + 1;

    container.insertAdjacentHTML("beforeend", this.createValueFieldHTML(groupId, index));

    const newField = container.lastElementChild;
    const btn = newField.querySelector(".delete-value");
    const input = newField.querySelector("input");

    btn.addEventListener("click", (e) => {
      this.deleteValue(e.target, group, groupId);
      this.saveToLocalStorage();
    });

    input.addEventListener("input", () => {
      this.saveToLocalStorage();
    });
  }

  deleteValue(button, group, groupId) {
    const container = group.querySelector(".option-values");
    const fields = container.querySelectorAll(".option-value");

    if (fields.length <= 1) {
      alert("You must have at least one value.");
      return;
    }

    button.closest(".option-value").remove();
    this.reindexFields(container, groupId);
  }

  reindexFields(container, groupId) {
    const fields = container.querySelectorAll(".option-value");
    fields.forEach((field, i) => {
      const index = i + 1;
      const label = field.querySelector("label");
      const input = field.querySelector("input");

      label.textContent = `Value ${index}:`;
      label.setAttribute("for", `option-value-${groupId}-${index}`);
      input.id = `option-value-${groupId}-${index}`;
    });
  }

  updateGroupHeaders() {
    const groups = this.querySelectorAll(".option-group");
    groups.forEach((group, i) => {
      const header = group.querySelector("h3");
      header.textContent = `Option Group ${i + 1}`;
    });
  }

  saveToLocalStorage() {
    const groups = this.querySelectorAll(".option-group");
    const data = Array.from(groups).map(group => {
      const name = group.querySelector("input[name='option-group']").value;
      const values = Array.from(group.querySelectorAll("input[name='option-value']")).map(i => i.value);
      return { name, values };
    });
    localStorage.setItem("optionGroupsData", JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("optionGroupsData") || "[]");
    const container = this.querySelector(".option-groups");
    const button = this.querySelector(".add-option-group");

    data.forEach((group, index) => {
      const groupEl = this.createOptionGroup(index + 1, group);
      container.insertBefore(groupEl, button);
    });
  }
}

customElements.define("detail-view", DetailView);
