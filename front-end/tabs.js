class DetailView extends HTMLElement {
  connectedCallback() {
    this.initMarkup();
    this.initOptionGroupLogic();
    this.loadFromLocalStorage();
  }

  initMarkup() {
    this.innerHTML = `
      <style>
        .option-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 500px;
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
      </style>
      
      <div class="option-groups">
        <button class="add-option-group">+ Create Custom option</button>
      </div>
    `;
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
          <input type="text" class="option-input temp-option-name" placeholder="e.g. Material" required>
          <div class="error-message">Option name is required.</div>
        </div>
        <div class="option-input-section">
          <span class="input-title">Option values</span>
          <div class="values-list">
            <input type="text" class="option-input temp-option-value" placeholder="e.g. Rubber">
          </div>
        </div>
        <div class="form-actions">
          <button class="action-btn delete-btn">Delete</button>
          <button class="action-btn done-btn">Done</button>
        </div>
      `;

      container.replaceChild(form, addOptionGroupButton);

      const nameInput = form.querySelector(".temp-option-name");
      const valuesContainer = form.querySelector(".values-list");
      const doneBtn = form.querySelector(".done-btn");
      const deleteBtn = form.querySelector(".delete-btn");
      const errorMessage = form.querySelector(".error-message");

      nameInput.focus();

      const addNewValueInput = (previousInput) => {
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.classList.add("option-input", "temp-option-value");
        newInput.placeholder = "e.g. Plastic";
        
        // Store reference to the input that generated this one
        newInput.dataset.generatedBy = previousInput.id;
        
        // Generate unique ID for each input
        previousInput.id = 'input-' + Math.random().toString(36).substr(2, 9);
        newInput.id = 'input-' + Math.random().toString(36).substr(2, 9);
        
        valuesContainer.appendChild(newInput);
        setupValueInputListeners(newInput);
        return newInput;
      };

      const setupValueInputListeners = (input) => {
        let generatedInput = null;
        
        input.addEventListener('input', (e) => {
          const currentInput = e.target;
          const allValueInputs = valuesContainer.querySelectorAll('.temp-option-value');
          
          // Generate new field if this is the last one and has content
          if (currentInput === allValueInputs[allValueInputs.length - 1] && 
              currentInput.value.trim() !== '' && 
              !generatedInput) {
            generatedInput = addNewValueInput(currentInput);
          }
          
          // Remove generated field if original becomes empty
          if (currentInput.value.trim() === '' && generatedInput) {
            generatedInput.remove();
            generatedInput = null;
          }
        });

        input.addEventListener('blur', (e) => {
          const currentInput = e.target;
          const allValueInputs = valuesContainer.querySelectorAll('.temp-option-value');
          
          // Clean up empty fields (except last one)
          if (currentInput.value.trim() === '' && allValueInputs.length > 1) {
            // Find and remove any fields this input generated
            const generatedField = valuesContainer.querySelector(`[data-generated-by="${currentInput.id}"]`);
            if (generatedField) generatedField.remove();
            
            // Only remove if it's not the last one
            if (currentInput !== allValueInputs[allValueInputs.length - 1]) {
              currentInput.remove();
            }
          }
        });
      };

      // Setup listener for the first input
      const firstValueInput = valuesContainer.querySelector('.temp-option-value');
      setupValueInputListeners(firstValueInput);

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
      });

      deleteBtn.addEventListener("click", () => {
        container.removeChild(form);
        container.appendChild(addOptionGroupButton);
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
      <button class="delete-option" title="Delete this option">×</button>
      <div class="saved-option-name">${name}</div>
      <div class="saved-values-container">
        ${valuesHTML}
      </div>
    `;

    wrapper.querySelectorAll(".delete-value").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".saved-value").remove();
        this.saveToLocalStorage();
      });
    });

    // Add click handler for the delete option button
    wrapper.querySelector(".delete-option").addEventListener("click", () => {
      wrapper.remove();
      this.saveToLocalStorage();
    });

    return wrapper;
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
  }

  loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("optionGroupsData") || "[]");
    const container = this.querySelector(".option-groups");
    const button = this.querySelector(".add-option-group");

    data.forEach(item => {
      const savedOption = this.createSavedOption(item.name, item.values);
      container.insertBefore(savedOption, button);
    });
  }
}

customElements.define("detail-view", DetailView);