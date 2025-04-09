(async function authenticateUser() {
  const authGate = document.getElementById('auth-gate');
  const authButton = document.getElementById('auth-button');
  const authMessage = document.getElementById('auth-message');
  const mainContent = document.querySelector('main');

  const verifyPassword = async (password) => {
    try {
      const response = await fetch('https://shopify-admin-api.onrender.com/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: password }),
      });

      const result = await response.json();
      return result.verified;
    } catch (err) {
      console.error('Verification failed:', err);
      return false;
    }
  };

  const showGateUI = (message = '🔒 Password required to use this application') => {
    mainContent.style.display = 'none';
    authMessage.textContent = message;
    authGate.style.display = 'block';
  };

  const hideGateUI = () => {
    authGate.style.display = 'none';
    mainContent.style.display = 'block';
  };

  const promptPassword = async () => {
    const password = prompt('Enter the secret code:');
    if (!password) {
      showGateUI(); // Canceled or empty
      return;
    }

    const isVerified = await verifyPassword(password);
    if (isVerified) {
      sessionStorage.setItem('appSecret', password);
      hideGateUI();
    } else {
      showGateUI('❌ Password is incorrect. Please try again.');
    }
  };

  // On load
  const savedPass = sessionStorage.getItem('appSecret');
  if (savedPass && await verifyPassword(savedPass)) {
    hideGateUI();
  } else {
    await promptPassword();
  }

  // Re-auth button click
  authButton.addEventListener('click', async () => {
    await promptPassword();
  });
})();