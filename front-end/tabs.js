class DetailView extends HTMLElement {
  constructor() {
    super();
  this.variantsData = new Map(); // Will store {price: string, image: string} for each variant
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
        .variants-section {
        position: relative;
        margin-top: 20px;
      }
      
      .variants-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      /* Make the table container scrollable */
      .variants-table-container {
        max-height: 400px; /* Adjust this value as needed */
        overflow-y: auto;
        border: 1px solid #ddd;
      }
      
      /* Sticky table header */
      .variants-table thead {
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
        box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
      }
      
      /* Table styling */
      .variants-table th, .variants-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .variants-table th {
        background-color: #f8f9fa;
        font-weight: 600;
      }
      
      .variants-table tr:hover {
        background-color: #f5f5f5;
      }
      
      /* Add some spacing between sections */
      .option-groups {
        margin-bottom: 20px;
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
            <th>Image</th>
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
      <button class="save-all-btn" id="save-all-btn">Save All Changes</button>
    </div>
  `;
}

// Update the setupHeaderCheckbox method
setupHeaderCheckbox() {
  const selectAll = this.querySelector("#select-all-variants");
  selectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = this.querySelectorAll(".variant-checkbox:not(#select-all-variants)");
    
    // Clear current selection
    this.selectedVariants.clear();
    
    // Update all checkboxes and selection state
    checkboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
      if (isChecked) {
        const variantName = checkbox.closest('tr').dataset.variantName;
        this.selectedVariants.add(variantName);
      }
    });
    
    this.updateBulkActions();
  });
}

// Update the deleteSelectedVariants method
deleteSelectedVariants() {
  if (this.selectedVariants.size === 0) return;

  // 1. First collect all variants that will remain after deletion
  const remainingVariants = new Set();
  this.querySelectorAll("#variants-table-body tr").forEach(row => {
    const variantName = row.dataset.variantName;
    const isSelected = this.selectedVariants.has(variantName);
    if (!isSelected) {
      remainingVariants.add(variantName);
    }
  });

  // 2. Remove from variantsData Map
  this.selectedVariants.forEach(variantName => {
    this.variantsData.delete(variantName);
  });

  // 3. Remove from UI table
  this.selectedVariants.forEach(variantName => {
    const row = this.querySelector(`tr[data-variant-name="${variantName}"]`);
    if (row) row.remove();
  });

  // 4. Analyze which option values can be safely deleted
  const valuesToDelete = new Set();
  const valuesToKeep = new Set();

  // First collect all values that are still in use
  remainingVariants.forEach(variantName => {
    variantName.split(' / ').forEach(value => {
      valuesToKeep.add(value.trim());
    });
  });

  // Then check which values in selected variants aren't used elsewhere
  this.selectedVariants.forEach(variantName => {
    variantName.split(' / ').forEach(value => {
      const val = value.trim();
      if (!valuesToKeep.has(val)) {
        valuesToDelete.add(val);
      }
    });
  });

  // 5. Remove the unused values from their option groups
  this.querySelectorAll(".saved-option").forEach(option => {
    const valuesContainer = option.querySelector(".saved-values-container");
    Array.from(valuesContainer.querySelectorAll(".saved-value")).forEach(valueEl => {
      const val = valueEl.querySelector("span").textContent;
      if (valuesToDelete.has(val)) {
        valueEl.remove();
      }
    });

    // Remove empty options
    if (valuesContainer.querySelectorAll(".saved-value").length === 0) {
      option.remove();
    }
  });

  // 6. Clear selection
  this.selectedVariants.clear();
  this.querySelector("#select-all-variants").checked = false;
  
  // 7. Update localStorage
  this.saveToLocalStorage();
  
  // 8. Update UI state
  this.updateBulkActions();
  
  // If no variants left, hide the section
  if (this.querySelectorAll("#variants-table-body tr").length === 0) {
    this.querySelector("#variants-section").classList.remove("visible");
  }
}

toggleVariantSelection(checkbox) {
  const row = checkbox.closest('tr');
  const variantName = row.dataset.variantName;
  
  if (checkbox.checked) {
    this.selectedVariants.add(variantName);
  } else {
    this.selectedVariants.delete(variantName);
  }
  
  // Update "Select All" checkbox state
  const allCheckboxes = this.querySelectorAll(".variant-checkbox:not(#select-all-variants)");
  const selectAll = this.querySelector("#select-all-variants");
  selectAll.checked = allCheckboxes.length > 0 && 
                     this.selectedVariants.size === allCheckboxes.length;
  
  this.updateBulkActions();
}

  updateBulkActions() {
    const bulkActions = this.querySelector("#bulk-actions");
    bulkActions.classList.toggle("visible", this.selectedVariants.size > 0);
    
    const bulkDeleteBtn = this.querySelector(".bulk-delete-btn");
    bulkDeleteBtn.onclick = () => this.deleteSelectedVariants();
  }

  generateAllCombinations() {
    const savedOptions = this.querySelectorAll(".saved-option");
    if (savedOptions.length === 0) return [];
    
    // Collect all option values grouped by option name
    const optionsMap = {};
    savedOptions.forEach(option => {
      const name = option.querySelector(".saved-option-name").textContent;
      const values = Array.from(option.querySelectorAll(".saved-value span"))
        .map(span => span.textContent);
      optionsMap[name] = values;
    });
    
    // Generate all possible combinations
    const optionNames = Object.keys(optionsMap);
    if (optionNames.length === 0) return [];
    
    let combinations = optionsMap[optionNames[0]].map(v => [v]);
    
    for (let i = 1; i < optionNames.length; i++) {
      const newCombinations = [];
      const currentValues = optionsMap[optionNames[i]];
      
      combinations.forEach(combination => {
        currentValues.forEach(value => {
          newCombinations.push([...combination, value]);
        });
      });
      
      combinations = newCombinations;
    }
    
    return combinations.map(comb => comb.join(" / "));
  }

 

  updateVariantsVisibility() {
    const variantsSection = this.querySelector("#variants-section");
    const hasOptions = this.hasValidOptions();
    
    variantsSection.classList.toggle("visible", hasOptions);
  }
  
  // Add this new helper method
  hasValidOptions() {
    // Check if there are any saved options with at least one value
    const savedOptions = this.querySelectorAll(".saved-option");
    for (const option of savedOptions) {
      const values = option.querySelectorAll(".saved-value");
      if (values.length > 0) {
        return true;
      }
    }
    
    // Check if there's a temporary option being edited with values
    const tempOption = this.querySelector(".temp-option-group");
    if (tempOption) {
      const tempValues = tempOption.querySelectorAll(".temp-option-value");
      for (const input of tempValues) {
        if (input.value.trim() !== "") {
          return true;
        }
      }
    }
    
    return false;
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
    wrapper.style.cursor = "pointer"; // Add pointer cursor
  
    const valuesHTML = values.map(val => `
      <div class="saved-value">
        <span>${val}</span>
        <button class="delete-value">×</button>
      </div>
    `).join("");
  
    wrapper.innerHTML = `
      <button class="delete-option" title="Delete this option">×</button>
      <div class="saved-option-name">${name}</div>
      <div class="saved-values-container">
        ${valuesHTML}
      </div>
    `;
  
    // Remove the edit button and make the whole wrapper clickable
    wrapper.addEventListener('click', (e) => {
      // Don't trigger edit if clicking on a delete button
      if (e.target.closest('.delete-option') || e.target.closest('.delete-value')) {
        return;
      }
      this.editSavedOption(wrapper, name, values);
    });
  
    // Rest of the existing event listeners...
    wrapper.querySelectorAll(".delete-value").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the wrapper click
        const valueToRemove = e.target.closest(".saved-value").querySelector("span").textContent;
        this.variantsData.delete(valueToRemove);
        this.selectedVariants.delete(valueToRemove);
        e.target.closest(".saved-value").remove();
        this.saveToLocalStorage();
        this.updateVariantsSection();
        this.updateBulkActions();
      });
    });
  
    wrapper.querySelector(".delete-option").addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering the wrapper click
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
    
    const variantData = Array.from(this.variantsData.entries()).map(([name, price]) => ({
      name,
      price
    }));
    localStorage.setItem("variantData", JSON.stringify(variantData));
  }

  loadFromLocalStorage() {
    const optionData = JSON.parse(localStorage.getItem("optionGroupsData") || "[]");
    const container = this.querySelector(".option-groups");
    const button = this.querySelector(".add-option-group");

    optionData.forEach(item => {
      const savedOption = this.createSavedOption(item.name, item.values);
      container.insertBefore(savedOption, button);
    });
    
    const variantData = JSON.parse(localStorage.getItem("variantData") || "[]");
    variantData.forEach(variant => {
      this.variantsData.set(variant.name, variant.price);
    });
    
    this.updateVariantsSection();
  }
  
  updateVariantsPreview() {
    const tempForm = this.querySelector(".temp-option-group");
    if (!tempForm) return;
    
    // Get all saved options first
    const savedOptions = this.querySelectorAll(".saved-option");
    const tempName = tempForm.querySelector(".temp-option-name")?.value.trim() || "";
    const tempValues = Array.from(tempForm.querySelectorAll(".temp-option-value"))
      .map(input => input.value.trim())
      .filter(val => val !== "");
    
    if (tempName && tempValues.length > 0) {
      // Create a temporary options map including the current form values
      const optionsMap = {};
      savedOptions.forEach(option => {
        const name = option.querySelector(".saved-option-name").textContent;
        const values = Array.from(option.querySelectorAll(".saved-value span"))
          .map(span => span.textContent);
        optionsMap[name] = values;
      });
      
      // Add the current temporary option
      optionsMap[tempName] = tempValues;
      
      // Generate combinations
      const optionNames = Object.keys(optionsMap);
      let combinations = optionsMap[optionNames[0]].map(v => [v]);
      
      for (let i = 1; i < optionNames.length; i++) {
        const newCombinations = [];
        const currentValues = optionsMap[optionNames[i]];
        
        combinations.forEach(combination => {
          currentValues.forEach(value => {
            newCombinations.push([...combination, value]);
          });
        });
        
        combinations = newCombinations;
      }
      
      const combinationStrings = combinations.map(comb => comb.join(" / "));
      const tableBody = this.querySelector("#variants-table-body");
      
      tableBody.innerHTML = combinationStrings.map(comb => `
        <tr data-variant-name="${comb}">
          <td>
            <input type="checkbox" class="variant-checkbox">
            ${comb}
          </td>
          <td>
            <div class="image-upload" data-variant-name="${comb}">
              <div class="upload-icon">📁</div>
              <div class="upload-text">Click or drag image</div>
              <img class="image-preview" src="${this.variantsData.get(comb)?.image || ''}">
              <button class="remove-image" title="Remove image">×</button>
              <input type="file" accept="image/*" style="display:none;">
            </div>
          </td>
          <td>
            <input type="text" class="variant-price-input" placeholder="0.00" 
                   value="${this.variantsData.get(comb)?.price || '2,000.00'}" 
                   data-variant-name="${comb}">
          </td>
        </tr>
      `).join("");
      
      // Initialize image upload for preview rows
      this.initImageUploads();
    } else {
      this.querySelector("#variants-table-body").innerHTML = "";
    }
    this.updateVariantsVisibility();
  }

  

  initImageUploads() {
    console.log('initImageUploads called');
    this.querySelectorAll('.image-upload').forEach(uploadArea => {
      const fileInput = uploadArea.querySelector('input[type="file"]');
      const preview = uploadArea.querySelector('.image-preview');
      const removeBtn = uploadArea.querySelector('.remove-image');
      const variantName = uploadArea.dataset.variantName;
      const variantData = this.variantsData.get(variantName) || {};
  
      // Show existing image if available
      if (variantData.image) {
        preview.src = variantData.image;
        uploadArea.classList.add('has-image');
      }
  
      // Prevent multiple clicks on the same area
      let isFileDialogOpen = false;
  
      uploadArea.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Upload area clicked');
      
        if (!uploadArea.isDialogOpen && e.target !== removeBtn && e.target !== fileInput) {
          console.log('Triggering file input dialog');
          uploadArea.isDialogOpen = true;
          fileInput.click();
      
          const resetFlag = () => {
            uploadArea.isDialogOpen = false;
            window.removeEventListener('focus', resetFlag);
          };
          window.addEventListener('focus', resetFlag);
        }
      });
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            preview.src = event.target.result;
            uploadArea.classList.add('has-image');
            // Update data immediately
            const variantData = this.variantsData.get(variantName) || {};
            variantData.image = event.target.result;
            this.variantsData.set(variantName, variantData);
          };
          reader.readAsDataURL(file);
        }
        // Reset the flag after a short delay to handle the case where the dialog is canceled
        setTimeout(() => {
          isFileDialogOpen = false;
        }, 500); // Adjust the delay as needed
      });
  
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.src = '';
        uploadArea.classList.remove('has-image');
        // Update data
        const variantData = this.variantsData.get(variantName) || {};
        delete variantData.image;
        this.variantsData.set(variantName, variantData);
      });
  
      // Drag and drop handlers
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#1976d2';
        uploadArea.style.background = '#f0f7ff';
      });
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = '';
      });
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      });
    });
}

  
  updateVariantsSection() {
    const combinations = this.generateAllCombinations();
    const tableBody = this.querySelector("#variants-table-body");
    
    tableBody.innerHTML = combinations.map(comb => {
      const variantData = this.variantsData.get(comb) || {};
      
      
      return `
      <tr data-variant-name="${comb}">
        <td>
          <input type="checkbox" class="variant-checkbox" 
              ${this.selectedVariants.has(comb) ? 'checked' : ''}>
          <span>${comb}</span>
        </td>
        <td>
          <div class="image-upload ${variantData.image ? 'has-image' : ''}" data-variant-name="${comb}">
            <div class="upload-icon">📁</div>
            <div class="upload-text">Click or drag image</div>
            <img class="image-preview" src="${variantData.image || ''}">
            <button class="remove-image" title="Remove image">×</button>
            <input type="file" accept="image/*" style="display:none;">
          </div>
        </td>
        <td>
          <input type="text" class="variant-price-input" placeholder="0.00" 
                 value="${variantData.price || '2,000.00'}"
                 data-variant-name="${comb}">
        </td>
      </tr>
    `;
  }).join("");

  
  
    // Initialize image upload functionality
    this.querySelectorAll('.image-upload').forEach(uploadArea => {
      const fileInput = uploadArea.querySelector('input[type="file"]');
      const preview = uploadArea.querySelector('.image-preview');
      const removeBtn = uploadArea.querySelector('.remove-image');
      const variantName = uploadArea.dataset.variantName;
      
      // Click to select file
      uploadArea.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target !== removeBtn) {
          fileInput.click();
        }
      });
      
      // Handle file selection
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            preview.src = event.target.result;
            uploadArea.classList.add('has-image');
            const variantData = this.variantsData.get(variantName) || {};
            variantData.image = event.target.result;
            this.variantsData.set(variantName, variantData);
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Remove image
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.src = '';
        uploadArea.classList.remove('has-image');
        const variantData = this.variantsData.get(variantName) || {};
        delete variantData.image;
        this.variantsData.set(variantName, variantData);
      });
      
      // Drag and drop functionality
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#1976d2';
        uploadArea.style.background = '#f0f7ff';
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = '';
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      });
    });

  // Initialize save button
  this.querySelector('#save-all-btn').addEventListener('click', () => {
    this.saveToBackend();
  });

    // Add event listeners to checkboxes
    this.querySelectorAll(".variant-checkbox:not(#select-all-variants)").forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleVariantSelection(e.target);
      });
    });
    
    // Add event listeners to price inputs
    this.querySelectorAll(".variant-price-input").forEach(input => {
      input.addEventListener('change', (e) => {
        const variantName = e.target.dataset.variantName;
        const variantData = this.variantsData.get(variantName) || {};
        variantData.price = e.target.value;
        this.variantsData.set(variantName, variantData);
        this.saveToLocalStorage();
      });
    });
    
    // Add click handler for entire row (excluding inputs)
    this.querySelectorAll("#variants-table-body tr").forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        const checkbox = row.querySelector('.variant-checkbox');
        checkbox.checked = !checkbox.checked;
        this.toggleVariantSelection(checkbox);
      });
    });
    
    this.updateVariantsVisibility();
    this.updateBulkActions();
  }

  saveToBackend() {
    // Prepare data for backend
    const data = {
      variants: Array.from(this.variantsData.entries()).map(([name, data]) => ({
        name,
        price: data.price,
        image: data.image
      })),
      options: Array.from(this.querySelectorAll('.saved-option')).map(option => ({
        name: option.querySelector('.saved-option-name').textContent,
        values: Array.from(option.querySelectorAll('.saved-value span')).map(span => span.textContent)
      }))
    };
  
    // Here you would typically use fetch or axios to send to your backend
    console.log('Saving to backend:', data); // For testing
    
    // Example fetch request (uncomment and adjust for your API)
    /*
    fetch('your-backend-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert('Changes saved successfully!');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Error saving changes');
    });
    */
    
    alert('Changes prepared for backend (check console for data)');
  }
}

customElements.define("detail-view", DetailView);