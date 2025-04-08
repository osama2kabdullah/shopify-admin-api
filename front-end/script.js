// Select the buttons
const addOptionGroupButton = document.querySelector(".add-option-group");
const optionGroupsContainer = document.querySelector(".option-groups");

// Initialize an index counter
let optionGroupIndex = 1;  // Start from 1 (1-based index)
let inputIdIndex = 1;  // Unique id index for inputs

// Function to add a new option group
function addOptionGroup() {
  const newOptionGroup = createOptionGroup(optionGroupIndex, inputIdIndex);

  // Add the new option group to the DOM at the end
  optionGroupsContainer.insertBefore(newOptionGroup, addOptionGroupButton);

  // Increment the option group and input index for the next group
  optionGroupIndex++;
  inputIdIndex++;
}

// Function to create a new option group with unique IDs
function createOptionGroup(groupIndex, inputIndex) {
  const newOptionGroup = document.createElement("div");
  newOptionGroup.classList.add("option-group");

  // Create the header for the option group (with 1-based index)
  const header = document.createElement("h3");
  header.textContent = `Option Group ${groupIndex}`;
  newOptionGroup.appendChild(header);

  // Generate unique IDs for the input fields in this option group
  const optionNameId = `option-name-${inputIndex}`;

  // HTML for option group with labels and inputs
  newOptionGroup.innerHTML += `
    <label for="${optionNameId}">Option Name:</label>
    <input type="text" id="${optionNameId}" name="option-group" placeholder="Enter option group name" required>
    <br><br>
    <div class="option-values">
      ${createValueField(1)}  <!-- Default first value -->
    </div>
    <button class="add-value">+ add value</button>
    <button class="delete-option-group">X</button>
  `;

  // Attach event listeners for "Add Value" and "Delete Option Group" buttons
  newOptionGroup.querySelector(".add-value").addEventListener("click", () => addValue(newOptionGroup));
  newOptionGroup.querySelector(".delete-option-group").addEventListener("click", () => deleteOptionGroup(newOptionGroup));

  // Ensure the event listener is attached to the first value's delete button
  const firstDeleteButton = newOptionGroup.querySelector(".delete-value");
  if (firstDeleteButton) {
    firstDeleteButton.addEventListener("click", (event) => deleteValue(event.target));
  }

  return newOptionGroup;
}

// Function to create a value field (with unique IDs)
function createValueField(valueIndex) {
  const valueId = `option-value-${valueIndex}`;
  return `
    <div class="option-value">
      <label for="${valueId}">Value ${valueIndex}:</label>
      <input type="text" id="${valueId}" name="option-value" placeholder="Enter option value" required>
      <button class="delete-value">X</button>
    </div>
  `;
}

// Function to add a new value field within an option group
function addValue(optionGroup) {
  const optionValuesContainer = optionGroup.querySelector(".option-values");
  const valueIndex = optionValuesContainer.querySelectorAll(".option-value").length + 1;

  // Create a new value field with unique ID
  const newValueField = createValueField(valueIndex);
  optionValuesContainer.insertAdjacentHTML('beforeend', newValueField);

  // Attach event listener to the new delete button for the value field
  const lastDeleteButton = optionValuesContainer.querySelectorAll(".delete-value");  
  lastDeleteButton[lastDeleteButton.length - 1].addEventListener("click", (event) => deleteValue(event.target));
}

// Function to delete a specific value field
function deleteValue(button) {
  const valueField = button.closest(".option-value");
  const optionGroup = button.closest(".option-group");
  const optionValuesContainer = optionGroup.querySelector(".option-values");

  // Check if there is more than one value field
  const valueFields = optionValuesContainer.querySelectorAll(".option-value");

  if (valueFields.length > 1) {
    valueField.remove();
    // Re-index value fields after deletion
    reindexValueFields(optionGroup);
  } else {
    alert("You must have at least one value.");
  }
}

// Function to re-index value fields within an option group after deletion
function reindexValueFields(optionGroup) {
  const valueFields = optionGroup.querySelectorAll(".option-value");

  valueFields.forEach((valueField, index) => {
    const label = valueField.querySelector('label');
    const input = valueField.querySelector('input');
    const valueIndex = index + 1;  // 1-based index

    // Update the label and input ID to match the new index
    if (label) {
      label.textContent = `Value ${valueIndex}:`;
    }
    if (input) {
      input.id = `option-value-${valueIndex}`;
      input.setAttribute("for", `option-value-${valueIndex}`);
    }
  });
}

// Function to delete an entire option group
function deleteOptionGroup(optionGroup) {
  optionGroup.remove();
  // Update option group indices
  updateOptionGroupIndices();
}

// Function to update the indices of remaining option groups
function updateOptionGroupIndices() {
  const optionGroups = document.querySelectorAll('.option-group');
  optionGroupIndex = 1;  // Reset to 1 after a group is deleted

  optionGroups.forEach(optionGroup => {
    const header = optionGroup.querySelector('h3');
    if (header) {
      header.textContent = `Option Group ${optionGroupIndex}`;
      optionGroupIndex++;
    }
  });
}

// Attach event listener to the initial "add option group" button
addOptionGroupButton.addEventListener("click", addOptionGroup);
