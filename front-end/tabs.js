class DetailView extends HTMLElement {

  constructor() {
    super();
    this.variantsData = new Map(); // To track variant prices
    this.selectedVariants = new Set();
  }

  connectedCallback() {
    this.initMarkup();
    this.initOptionGroupLogic();
    this.loadFromLocalStorage();
    this.updateVariantsVisibility();
    this.setupHeaderCheckbox();
  }
  initMarkup() {
    this.innerHTML = `
      <style>

      .edit-option {
          position: absolute;
          top: 15px;
          right: 40px;
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        
        .bulk-actions {
          display: none;
          margin-top: 10px;
        }
        
        .bulk-actions.visible {
          display: flex;
          gap: 10px;
        }
        
        .bulk-delete-btn {
          background: #d32f2f;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .option-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .temp-option-group {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .option-input-section {
          margin-bottom: 20px;
        }
        
        .input-title {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        
        .option-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .error-message {
          color: #d32f2f;
          font-size: 13px;
          margin-top: 5px;
          display: none;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .action-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          border: none;
        }
        
        .delete-btn {
          background: none;
          color: #d32f2f;
          border: 1px solid #d32f2f;
        }
        
        .done-btn {
          background: #1976d2;
          color: white;
        }
        
        .add-option-group {
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px dashed #ddd;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          color: #1976d2;
          font-size: 14px;
          font-weight: 500;
        }
        
        .saved-option {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .saved-option-name {
          font-weight: bold;
          color: black;
          margin-bottom: 10px;
          padding-right: 20px;
        }
        
        .saved-values-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .saved-value {
          background: #f5f5f5;
          color: black;
          padding: 6px 12px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .saved-value button {
          background: none;
          border: none;
          color: #d32f2f;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
        }
        
        .values-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .delete-option {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: #d32f2f;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }
        
        /* Variants section styles */
        .variants-section {
          margin-top: 30px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: none;
        }
        
        .variants-section.visible {
          display: block;
        }
        
        .variants-header {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .variants-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          color: black;
        }
        
        .variants-table th {
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #ddd;
          font-weight: 500;
        }
        
        .variants-table td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .variant-checkbox {
          margin-right: 10px;
          
        }
        
        .variant-price-input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100px;
        }
        
        .add-another-value {
          margin-top: 10px;
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          text-align: left;
        }
      </style>
      
      <div class="option-groups">
        <button class="add-option-group">+ Create Custom option</button>
      </div>
      
      <div class="variants-section" id="variants-section">
        <div class="variants-header">Variants</div>
        <table class="variants-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="select-all-variants" class="variant-checkbox"> Variant</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody id="variants-table-body">
            <!-- Variants will be added here dynamically -->
          </tbody>
        </table>
        <div class="bulk-actions" id="bulk-actions">
          <button class="bulk-delete-btn">Delete Selected</button>
        </div>
      </div>
    `;
  }

  setupHeaderCheckbox() {
    const selectAll = this.querySelector("#select-all-variants");
    selectAll.addEventListener('change', (e) => {
      const checkboxes = this.querySelectorAll(".variant-checkbox:not(#select-all-variants)");
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        this.toggleVariantSelection(checkbox);
      });
      this.updateBulkActions();
    });
  }

  toggleVariantSelection(checkbox) {
    const variantName = checkbox.closest('tr').querySelector('td:first-child').textContent.trim();
    if (checkbox.checked) {
      this.selectedVariants.add(variantName);
    } else {
      this.selectedVariants.delete(variantName);
    }
    this.querySelector("#select-all-variants").checked = false;
    this.updateBulkActions();
  }

  updateBulkActions() {
    const bulkActions = this.querySelector("#bulk-actions");
    bulkActions.classList.toggle("visible", this.selectedVariants.size > 0);
    
    // Update delete button event listener
    const bulkDeleteBtn = this.querySelector(".bulk-delete-btn");
    bulkDeleteBtn.onclick = () => this.deleteSelectedVariants();
  }

  deleteSelectedVariants() {
    if (this.selectedVariants.size === 0) return;

    // Remove from variantsData
    this.selectedVariants.forEach(val => {
      this.variantsData.delete(val);
    });

    // Remove from saved options
    this.querySelectorAll(".saved-option").forEach(option => {
      const valuesContainer = option.querySelector(".saved-values-container");
      Array.from(valuesContainer.querySelectorAll(".saved-value")).forEach(valueEl => {
        const val = valueEl.querySelector("span").textContent;
        if (this.selectedVariants.has(val)) {
          valueEl.remove();
        }
      });

      // Remove option if no values left
      if (valuesContainer.querySelectorAll(".saved-value").length === 0) {
        option.remove();
      }
    });

    // Clear selection
    this.selectedVariants.clear();
    this.querySelector("#select-all-variants").checked = false;
    
    this.saveToLocalStorage();
    this.updateVariantsSection();
  }

  updateVariantsVisibility() {
    const variantsSection = this.querySelector("#variants-section");
    const hasOptions = this.querySelectorAll(".saved-option").length > 0 || 
                      this.querySelector(".temp-option-group") !== null;
    
    variantsSection.classList.toggle("visible", hasOptions);
  }

  initOptionGroupLogic() {
    const addOptionGroupButton = this.querySelector(".add-option-group");
    const container = this.querySelector(".option-groups");

    addOptionGroupButton.addEventListener("click", () => {
      const form = document.createElement("div");
      form.classList.add("temp-option-group");
      
      form.innerHTML = `
        <div class="option-input-section">
          <span class="input-title">Option name</span>
          <input type="text" class="option-input temp-option-name" placeholder="e.g. Color" required>
          <div class="error-message">Option name is required.</div>
        </div>
        <div class="option-input-section">
          <span class="input-title">Option values</span>
          <div class="values-list">
            <input type="text" class="option-input temp-option-value" placeholder="e.g. Red">
          </div>
          <button class="add-another-value">+ Add another value</button>
        </div>
        <div class="form-actions">
          <button class="action-btn delete-btn">Delete</button>
          <button class="action-btn done-btn">Done</button>
        </div>
      `;

      container.replaceChild(form, addOptionGroupButton);
      this.updateVariantsVisibility();

      const nameInput = form.querySelector(".temp-option-name");
      const valuesContainer = form.querySelector(".values-list");
      const doneBtn = form.querySelector(".done-btn");
      const deleteBtn = form.querySelector(".delete-btn");
      const errorMessage = form.querySelector(".error-message");
      const addAnotherValueBtn = form.querySelector(".add-another-value");

      nameInput.focus();

      const addNewValueInput = (previousInput) => {
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.classList.add("option-input", "temp-option-value");
        newInput.placeholder = "e.g. Green";
        
        valuesContainer.appendChild(newInput);
        setupValueInputListeners(newInput);
        return newInput;
      };

      const setupValueInputListeners = (input) => {
        let generatedInput = null;
        
        input.addEventListener('input', (e) => {
          const currentInput = e.target;
          const allValueInputs = valuesContainer.querySelectorAll('.temp-option-value');
          
          if (currentInput === allValueInputs[allValueInputs.length - 1] && 
              currentInput.value.trim() !== '' && 
              !generatedInput) {
            generatedInput = addNewValueInput(currentInput);
          }
          
          if (currentInput.value.trim() === '' && generatedInput) {
            generatedInput.remove();
            generatedInput = null;
          }
          
          this.updateVariantsPreview();
        });
      };

      const firstValueInput = valuesContainer.querySelector('.temp-option-value');
      setupValueInputListeners(firstValueInput);

      addAnotherValueBtn.addEventListener('click', () => {
        const lastInput = valuesContainer.querySelector('.temp-option-value:last-of-type');
        addNewValueInput(lastInput);
        this.updateVariantsPreview();
      });

      doneBtn.addEventListener("click", () => {
        const optionName = nameInput.value.trim();
        const optionValues = Array.from(valuesContainer.querySelectorAll(".temp-option-value"))
          .map(input => input.value.trim())
          .filter(Boolean);

        if (!optionName) {
          errorMessage.style.display = "block";
          nameInput.focus();
          return;
        }

        if (optionValues.length === 0) {
          alert("You must have at least one option value.");
          return;
        }

        const savedOption = this.createSavedOption(optionName, optionValues);
        container.insertBefore(savedOption, form);
        container.removeChild(form);
        container.appendChild(addOptionGroupButton);
        
        this.saveToLocalStorage();
        this.updateVariantsSection();
      });

      deleteBtn.addEventListener("click", () => {
        container.removeChild(form);
        container.appendChild(addOptionGroupButton);
        this.updateVariantsVisibility();
      });
    });
  }

  createSavedOption(name, values) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("saved-option");

    const valuesHTML = values.map(val => `
      <div class="saved-value">
        <span>${val}</span>
        <button class="delete-value">×</button>
      </div>
    `).join("");

    wrapper.innerHTML = `
      <button class="edit-option" title="Edit this option">✏️</button>
      <button class="delete-option" title="Delete this option">×</button>
      <div class="saved-option-name">${name}</div>
      <div class="saved-values-container">
        ${valuesHTML}
      </div>
    `;

    wrapper.querySelectorAll(".delete-value").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const valueToRemove = e.target.closest(".saved-value").querySelector("span").textContent;
        this.variantsData.delete(valueToRemove);
        this.selectedVariants.delete(valueToRemove);
        e.target.closest(".saved-value").remove();
        this.saveToLocalStorage();
        this.updateVariantsSection();
        this.updateBulkActions();
      });
    });

    wrapper.querySelector(".delete-option").addEventListener("click", () => {
      Array.from(wrapper.querySelectorAll(".saved-value span")).forEach(span => {
        const value = span.textContent;
        this.variantsData.delete(value);
        this.selectedVariants.delete(value);
      });
      wrapper.remove();
      this.saveToLocalStorage();
      this.updateVariantsSection();
      this.updateBulkActions();
    });

    // Add edit functionality
    wrapper.querySelector(".edit-option").addEventListener("click", () => {
      this.editSavedOption(wrapper, name, values);
    });

    return wrapper;
  }

  editSavedOption(wrapper, originalName, originalValues) {
    const container = this.querySelector(".option-groups");
    const addOptionGroupButton = this.querySelector(".add-option-group");
    
    const form = document.createElement("div");
    form.classList.add("temp-option-group");
    
    const valuesHTML = originalValues.map(val => `
      <input type="text" class="option-input temp-option-value" 
             placeholder="e.g. Red" value="${val}">
    `).join("");
    
    form.innerHTML = `
      <div class="option-input-section">
        <span class="input-title">Option name</span>
        <input type="text" class="option-input temp-option-name" 
               placeholder="e.g. Color" value="${originalName}" required>
        <div class="error-message">Option name is required.</div>
      </div>
      <div class="option-input-section">
        <span class="input-title">Option values</span>
        <div class="values-list">
          ${valuesHTML}
        </div>
        <button class="add-another-value">+ Add another value</button>
      </div>
      <div class="form-actions">
        <button class="action-btn delete-btn">Cancel</button>
        <button class="action-btn done-btn">Save</button>
      </div>
    `;

    container.insertBefore(form, wrapper);
    wrapper.style.display = "none";
    this.updateVariantsVisibility();

    const nameInput = form.querySelector(".temp-option-name");
    const valuesContainer = form.querySelector(".values-list");
    const doneBtn = form.querySelector(".done-btn");
    const deleteBtn = form.querySelector(".delete-btn");
    const errorMessage = form.querySelector(".error-message");
    const addAnotherValueBtn = form.querySelector(".add-another-value");

    nameInput.focus();

    const setupValueInputListeners = (input) => {
      let generatedInput = null;
      
      input.addEventListener('input', (e) => {
        const currentInput = e.target;
        const allValueInputs = valuesContainer.querySelectorAll('.temp-option-value');
        
        if (currentInput === allValueInputs[allValueInputs.length - 1] && 
            currentInput.value.trim() !== '' && 
            !generatedInput) {
          generatedInput = document.createElement("input");
          generatedInput.type = "text";
          generatedInput.classList.add("option-input", "temp-option-value");
          generatedInput.placeholder = "e.g. Green";
          valuesContainer.appendChild(generatedInput);
          setupValueInputListeners(generatedInput);
        }
        
        this.updateVariantsPreview();
      });
    };

    Array.from(valuesContainer.querySelectorAll('.temp-option-value')).forEach(input => {
      setupValueInputListeners(input);
    });

    addAnotherValueBtn.addEventListener('click', () => {
      const lastInput = valuesContainer.querySelector('.temp-option-value:last-of-type');
      const newInput = document.createElement("input");
      newInput.type = "text";
      newInput.classList.add("option-input", "temp-option-value");
      newInput.placeholder = "e.g. Green";
      valuesContainer.appendChild(newInput);
      setupValueInputListeners(newInput);
      this.updateVariantsPreview();
    });

    doneBtn.addEventListener("click", () => {
      const optionName = nameInput.value.trim();
      const optionValues = Array.from(valuesContainer.querySelectorAll(".temp-option-value"))
        .map(input => input.value.trim())
        .filter(Boolean);

      if (!optionName) {
        errorMessage.style.display = "block";
        nameInput.focus();
        return;
      }

      if (optionValues.length === 0) {
        alert("You must have at least one option value.");
        return;
      }

      // Remove old variants that aren't in the new values
      originalValues.forEach(val => {
        if (!optionValues.includes(val)) {
          this.variantsData.delete(val);
          this.selectedVariants.delete(val);
        }
      });

      const savedOption = this.createSavedOption(optionName, optionValues);
      container.insertBefore(savedOption, form);
      container.removeChild(form);
      wrapper.remove();
      
      this.saveToLocalStorage();
      this.updateVariantsSection();
    });

    deleteBtn.addEventListener("click", () => {
      container.removeChild(form);
      wrapper.style.display = "block";
      this.updateVariantsVisibility();
    });
  }

  saveToLocalStorage() {
    const savedOptions = this.querySelectorAll(".saved-option");
    const data = Array.from(savedOptions).map(option => {
      return {
        name: option.querySelector(".saved-option-name").textContent,
        values: Array.from(option.querySelectorAll(".saved-value span")).map(span => span.textContent)
      };
    });
    
    localStorage.setItem("optionGroupsData", JSON.stringify(data));
    
    // Save variant prices
    const variantData = Array.from(this.variantsData.entries()).map(([name, price]) => ({
      name,
      price
    }));
    localStorage.setItem("variantData", JSON.stringify(variantData));
  }

  loadFromLocalStorage() {
    // Load option groups
    const optionData = JSON.parse(localStorage.getItem("optionGroupsData") || "[]");
    const container = this.querySelector(".option-groups");
    const button = this.querySelector(".add-option-group");

    optionData.forEach(item => {
      const savedOption = this.createSavedOption(item.name, item.values);
      container.insertBefore(savedOption, button);
    });
    
    // Load variant prices
    const variantData = JSON.parse(localStorage.getItem("variantData") || "[]");
    variantData.forEach(variant => {
      this.variantsData.set(variant.name, variant.price);
    });
    
    this.updateVariantsSection();
  }
  
  updateVariantsPreview() {
    const tempForm = this.querySelector(".temp-option-group");
    if (!tempForm) return;
    
    const valueInputs = tempForm.querySelectorAll(".temp-option-value");
    
    const values = Array.from(valueInputs)
      .map(input => input.value.trim())
      .filter(val => val !== "");
    
    if (values.length > 0) {
      const tableBody = this.querySelector("#variants-table-body");
      
      tableBody.innerHTML = values.map(val => `
        <tr>
          <td>
            <input type="checkbox" class="variant-checkbox" 
                  ${this.selectedVariants.has(val) ? 'checked' : ''}>
            ${val}
          </td>
          <td>
            <input type="text" class="variant-price-input" placeholder="0.00" 
                   value="${this.variantsData.get(val) || '2,000.00'}" 
                   data-variant-name="${val}">
          </td>
        </tr>
      `).join("");
      
      this.querySelectorAll(".variant-checkbox").forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          this.toggleVariantSelection(e.target);
        });
      });
      
      this.querySelectorAll(".variant-price-input").forEach(input => {
        input.addEventListener('change', (e) => {
          const variantName = e.target.dataset.variantName;
          this.variantsData.set(variantName, e.target.value);
          this.saveToLocalStorage();
        });
      });
    } else {
      this.querySelector("#variants-table-body").innerHTML = "";
    }
    this.updateVariantsVisibility();
  }
  
  updateVariantsSection() {
    const savedOptions = this.querySelectorAll(".saved-option");
    const tableBody = this.querySelector("#variants-table-body");
    
    if (savedOptions.length === 0) {
      tableBody.innerHTML = "";
      this.updateVariantsVisibility();
      this.updateBulkActions();
      return;
    }
    
    const allValues = [];
    savedOptions.forEach(option => {
      const values = Array.from(option.querySelectorAll(".saved-value span"))
        .map(span => span.textContent);
      allValues.push(...values);
    });
    
    tableBody.innerHTML = allValues.map(val => `
      <tr>
        <td>
          <input type="checkbox" class="variant-checkbox" 
                ${this.selectedVariants.has(val) ? 'checked' : ''}>
          ${val}
        </td>
        <td>
          <input type="text" class="variant-price-input" placeholder="0.00" 
                 value="${this.variantsData.get(val) || '2,000.00'}"
                 data-variant-name="${val}">
        </td>
      </tr>
    `).join("");
    
    this.querySelectorAll(".variant-checkbox").forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.toggleVariantSelection(e.target);
      });
    });
    
    this.querySelectorAll(".variant-price-input").forEach(input => {
      input.addEventListener('change', (e) => {
        const variantName = e.target.dataset.variantName;
        this.variantsData.set(variantName, e.target.value);
        this.saveToLocalStorage();
      });
    });
    
    this.updateVariantsVisibility();
    this.updateBulkActions();
  }
}

customElements.define("detail-view", DetailView);