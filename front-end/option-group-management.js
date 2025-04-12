const addOptionGroupButton = document.querySelector(".add-option-group");
const optionGroupsContainer = document.querySelector(".option-groups");

// Utility to get the next available group ID based on how many exist
function getNextGroupId() {
  return document.querySelectorAll(".option-group").length + 1;
}

// Function to create an option group element
function createOptionGroup(groupIndex, groupData = null) {
  const optionGroup = document.createElement("div");
  optionGroup.classList.add("option-group");

  const groupId = groupIndex;

  const valuesHTML = (groupData?.values || [""]).map((value, i) => createValueFieldHTML(groupId, i + 1, value)).join("");

  optionGroup.innerHTML = `
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

  // Event listeners
  optionGroup.querySelector(".add-value").addEventListener("click", () => {
    addValue(optionGroup, groupId);
    saveToLocalStorage();
  });

  optionGroup.querySelector(".delete-option-group").addEventListener("click", () => {
    deleteOptionGroup(optionGroup);
    saveToLocalStorage();
  });

  // Delete buttons + input events for each value field
  const values = optionGroup.querySelectorAll(".option-value");
  values.forEach(valueField => {
    const deleteBtn = valueField.querySelector(".delete-value");
    const input = valueField.querySelector("input");

    deleteBtn.addEventListener("click", (e) => {
      deleteValue(e.target, optionGroup, groupId);
      saveToLocalStorage();
    });

    input.addEventListener("input", saveToLocalStorage);
  });

  // Group name input
  const nameInput = optionGroup.querySelector("input[name='option-group']");
  nameInput.addEventListener("input", saveToLocalStorage);

  return optionGroup;
}

// Create value field HTML (used for rendering a value)
function createValueFieldHTML(groupId, valueIndex, value = "") {
  return `
    <div class="option-value">
      <label for="option-value-${groupId}-${valueIndex}">Value ${valueIndex}:</label>
      <input type="text" id="option-value-${groupId}-${valueIndex}" name="option-value" value="${value}" placeholder="Enter option value" required>
      <button class="delete-value">X</button>
    </div>
  `;
}

// Add new value field to a group
function addValue(optionGroup, groupId) {
  const valuesContainer = optionGroup.querySelector(".option-values");
  const currentCount = valuesContainer.querySelectorAll(".option-value").length;
  const newIndex = currentCount + 1;

  valuesContainer.insertAdjacentHTML("beforeend", createValueFieldHTML(groupId, newIndex));

  const newField = valuesContainer.lastElementChild;
  const newDeleteBtn = newField.querySelector(".delete-value");
  const newInput = newField.querySelector("input");

  newDeleteBtn.addEventListener("click", (e) => {
    deleteValue(e.target, optionGroup, groupId);
    saveToLocalStorage();
  });

  newInput.addEventListener("input", saveToLocalStorage);
}

// Delete value field, ensuring at least one remains
function deleteValue(button, optionGroup, groupId) {
  const valuesContainer = optionGroup.querySelector(".option-values");
  const allValues = valuesContainer.querySelectorAll(".option-value");

  if (allValues.length <= 1) {
    alert("You must have at least one value.");
    return;
  }

  button.closest(".option-value").remove();
  reindexValueFields(valuesContainer, groupId);
}

// Reindex all values in a group after deletion
function reindexValueFields(container, groupId) {
  const valueFields = container.querySelectorAll(".option-value");
  valueFields.forEach((field, i) => {
    const newIndex = i + 1;
    const label = field.querySelector("label");
    const input = field.querySelector("input");

    label.textContent = `Value ${newIndex}:`;
    label.setAttribute("for", `option-value-${groupId}-${newIndex}`);
    input.id = `option-value-${groupId}-${newIndex}`;
  });
}

// Delete entire option group
function deleteOptionGroup(groupElement) {
  groupElement.remove();
  updateGroupDisplayIndices();
}

// Recalculate the visible group headers (1-based display)
function updateGroupDisplayIndices() {
  const groups = document.querySelectorAll(".option-group");
  groups.forEach((group, index) => {
    const header = group.querySelector("h3");
    header.textContent = `Option Group ${index + 1}`;
  });
}

// Save all current groups and values to localStorage
function saveToLocalStorage() {
  const groups = document.querySelectorAll(".option-group");
  const data = Array.from(groups).map(group => {
    const name = group.querySelector("input[name='option-group']").value;
    const values = Array.from(group.querySelectorAll("input[name='option-value']")).map(v => v.value);
    return { name, values };
  });

  localStorage.setItem("optionGroupsData", JSON.stringify(data));
}

// Load groups from localStorage if present
function loadFromLocalStorage() {
  const savedData = JSON.parse(localStorage.getItem("optionGroupsData")) || [];
  savedData.forEach((groupData, index) => {
    const newGroup = createOptionGroup(index + 1, groupData);
    optionGroupsContainer.insertBefore(newGroup, addOptionGroupButton);
  });
}

// Add option group button click
addOptionGroupButton.addEventListener("click", () => {
  const nextGroupId = getNextGroupId();
  const newGroup = createOptionGroup(nextGroupId);
  optionGroupsContainer.insertBefore(newGroup, addOptionGroupButton);
  saveToLocalStorage();
});

// Init
document.addEventListener("DOMContentLoaded", loadFromLocalStorage);