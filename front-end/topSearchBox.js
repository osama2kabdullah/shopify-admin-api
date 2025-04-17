document.addEventListener('DOMContentLoaded', () => {
    console.log('topSearchBox.js loaded');
    const searchForm = document.getElementById('search-product');
    const searchBoxContainer = document.querySelector('.search-box-container');
  
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the default form submission
  
      // Move the search box to the top by adding the 'top-search-box' class
      searchBoxContainer.classList.add('top-search-box');

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
  
      // Perform the search (you can add your search logic here)
      const searchTerm = document.getElementById('product').value;
      console.log('Searching for:', searchTerm);
  
      // Example: Fetch data from the API
      fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => response.json())
        .then(data => {
          const resultsContainer = document.getElementById('results');
          resultsContainer.innerHTML = ''; // Clear previous results
          data.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.textContent = user.name;
            resultsContainer.appendChild(resultItem);
          });
          resultsContainer.style.display = 'block';
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    });
  });
