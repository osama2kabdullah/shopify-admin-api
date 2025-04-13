class SearchForm extends HTMLElement {
  constructor() {
    super();
    this.cachedResults = {}; // Cache results based on query
  }

  connectedCallback() {
    this.input = this.querySelector("#product");
    this.suggestions = this.querySelector("#suggestions");
    this.results = this.querySelector("#results");
    this.form = this.querySelector("#search-product");
    this.searchButton = this.querySelector("#search-product-button");
  
    this.input.addEventListener("input", this.handleInput.bind(this));
    this.form.addEventListener("submit", this.handleSubmit.bind(this));
    this.suggestions.addEventListener("click", this.handleSuggestionClick.bind(this));
    this.input.addEventListener("focus", this.handleFocus.bind(this));
    this.input.addEventListener("click", this.handleFocus.bind(this));
    document.addEventListener("click", this.handleOutsideClick.bind(this));
  
    // 🔁 Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.loadFromURL();
    });
  
    this.loadFromURL();
  }  

  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("product");
    const detailId = params.get("id");
    this.input.value = query;
  
    if (detailId) {
      this.showDetailView(detailId);
      return;
    }
    if (query) {
      this.handleSubmit(); // Will call updateURL with pushState
    }
  
  }  

  updateURL(query) {
    const params = new URLSearchParams();
    params.set("product", query); // start fresh — don't inherit old detailId
    const newURL = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, "", newURL); // 👈 pushState instead of replaceState
  }   

  handleInput(e) {
    const value = e.target.value.toLowerCase().trim();
    this.debouncedFetchSuggestions(value);
  }

  handleFocus() {
    const query = this.input.value.toLowerCase().trim();
    if (query.length > 0) {
      if (this.suggestions.innerHTML.trim() !== "") {
        this.suggestions.style.display = "block";
      } else {
        this.fetchSuggestions(query);
      }
    }
  }

  debouncedFetchSuggestions = (() => {
    let timeout;
    return (query) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.fetchSuggestions(query), 300);
    };
  })();

  fetchSuggestions(query) {
    if (query.length < 1) {
      this.suggestions.innerHTML = "";
      this.suggestions.style.display = "none";
      return;
    }

    this.suggestions.innerHTML = `<li class="loading-message"><span class="spinner"></span> Loading suggestions...</li>`;
    this.suggestions.style.display = "block";

    fetch("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.json())
      .then((users) => {
        const matches = users.filter((user) =>
          user.name.toLowerCase().includes(query)
        );
        this.renderSuggestions(matches);
      })
      .catch((error) => {
        this.suggestions.innerHTML = `<li class="loading-message">Error loading suggestions</li>`;
        console.error("Suggestion fetch error:", error);
      });
  }

  renderSuggestions(items) {
    if (items.length === 0) {
      this.suggestions.innerHTML = "<li>No suggestions</li>";
    } else {
      this.suggestions.innerHTML = items
        .map((item) => `<li style="cursor:pointer;">${item.name}</li>`)
        .join("");
    }
    this.suggestions.style.display = "block";
  }

  handleSuggestionClick(e) {
    if (e.target.tagName.toLowerCase() === "li") {
      this.input.value = e.target.textContent;
      this.suggestions.innerHTML = "";
      this.suggestions.style.display = "none";
      this.input.blur();
      this.handleSubmit(new Event("submit"));
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      // this.suggestions.innerHTML = "";
      this.suggestions.style.display = "none";
    }
  }

  async handleSubmit(e) {
    if (e) e.preventDefault();
  
    const query = this.input.value.trim().toLowerCase();
    if (!query) return;
  
    this.updateURL(query);
    this.setSearchLoading(true);
    this.results.innerHTML = ""; // Clear old content
  
    // Remove old Clear button before adding a new one
    const existingClear = this.querySelector("#clear-search-button");
    if (existingClear) existingClear.remove();
  
    try {
      // Use cached results if available
      if (this.cachedResults[query]) {
        this.renderResults(this.cachedResults[query]);
      } else {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        const users = await res.json();
  
        const filtered = users.filter((user) =>
          user.name.toLowerCase().includes(query)
        );
  
        this.cachedResults[query] = filtered;
        this.renderResults(filtered);
      }
    } catch (error) {
      this.results.innerHTML = "<p>Error fetching results.</p>";
      console.error("Search fetch error:", error);
    } finally {
      this.setSearchLoading(false);
      this.suggestions.innerHTML = "";
      this.suggestions.style.display = "none";
      this.results.style.display = "block";
  
      // Always add the Clear button if results section is visible
      if (this.results.innerHTML.trim() !== "") {
        this.addClearSearchButton();
      }
    }
  }  

  renderResults(items) {
    if (items.length === 0) {
      this.results.innerHTML = "<p>No results found.</p>";
      this.results.style.display = "block"; // 👈 Just in case
      return;
    }

    this.results.innerHTML = items
      .map(
        (user) => `
          <div>
            <strong class="result-title" data-id="${user.id}" style="cursor:pointer; color:blue; text-decoration:underline;">
              ${user.name}
            </strong>
            <br/>
            <small>${user.email}</small>
          </div>
        `
      )
      .join("<hr/>");
    this.results.style.display = "block";
    this.results.querySelectorAll(".result-title").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        this.showDetailView(id);
      });
    });    
  }

  backToSearchResults() {
    const params = new URLSearchParams(window.location.search);
    params.delete("view");
    params.delete("id");
    const newURL = `${window.location.pathname}?${params.toString()}`;
    history.replaceState({}, "", newURL);
  
    this.loadFromURL();
  }  

  showDetailView(id) {
    // Save state in URL
    const params = new URLSearchParams(window.location.search);
    params.set("view", "details");
    params.set("id", id);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    history.replaceState({}, "", newURL);
  
    // Clear previous UI
    this.results.innerHTML = "";
  
    // Inject your detail HTML here (for now just dummy)
    this.results.innerHTML = `
      <div class="detail-view">
        <button id="back-to-results" style="margin-bottom: 10px;">⬅ Back</button>
        <div>Hello World for user ID: ${id}</div>
      </div>
    `;
  
    // Show results container (if hidden)
    this.results.style.display = "block";
  
    // Hide clear button
    const clearButton = this.querySelector("#clear-search-button");
    if (clearButton) clearButton.remove();
  
    // Handle back button
    this.results.querySelector("#back-to-results").addEventListener("click", () => {
      this.backToSearchResults();
    });
  }  

  addClearSearchButton() {
    const clearButton = document.createElement("a");
    clearButton.className = "clear-search-button";
    clearButton.href = "#";
    clearButton.id = "clear-search-button";
    clearButton.textContent = "Clear";

    // Attach event listener to clear the search
    clearButton.addEventListener("click", (e) => {
      e.preventDefault(); // 👈 add this
      this.clearSearch();
    });    

    // Append the clear button above the results
    this.results.insertAdjacentElement("beforebegin", clearButton);
  }

  clearSearch() {
    // Clear input and results
    this.input.value = "";
    this.suggestions.innerHTML = "";
    this.results.innerHTML = "";
    this.suggestions.style.display = "none";
    this.results.style.display = "none";

    // Remove the "Clear Search" button
    const clearButton = this.querySelector("#clear-search-button");
    if (clearButton) clearButton.remove();

    // Clear the URL parameter
    const params = new URLSearchParams(window.location.search);
    params.delete("product");
    const newURL = `${window.location.pathname}`;
    history.replaceState({}, "", newURL);
  }

  setSearchLoading(isLoading) {
    if (isLoading) {
      this.searchButton.classList.add("loading");
      this.searchButton.innerHTML = `<span class="spinner"></span> Searching...`;
    } else {
      this.searchButton.classList.remove("loading");
      this.searchButton.innerHTML = `Search`;
    }
  }
}

customElements.define("search-form", SearchForm);
