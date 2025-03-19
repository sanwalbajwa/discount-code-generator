document.addEventListener('DOMContentLoaded', function() {
  const generateForm = document.getElementById('generate-form');
  const resultsPanel = document.querySelector('.results-panel');
  const codesTable = document.getElementById('codes-table').querySelector('tbody');
  const exportButton = document.getElementById('export-button');
  
  // Function to generate random 8-digit scratch code
  function generateScratchCode() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
  
  // Function to generate random discount code
  function generateDiscountCode() {
    return "ZEN" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  // Handle form submission
  generateForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    // Get tier information
    const tiers = [];
    let totalProbability = 0;
    
    for (let i = 1; i <= 4; i++) {
      const discountValue = parseInt(document.getElementById(`tier${i}-discount`).value);
      const probability = parseInt(document.getElementById(`tier${i}-probability`).value);
      
      totalProbability += probability;
      
      tiers.push({
        tierNumber: i,
        discountValue: discountValue,
        probability: probability
      });
    }
    
    // Validate total probability equals 100%
    if (totalProbability !== 100) {
      alert('Total probability must equal 100%');
      return;
    }
    
    // Generate codes
    const newCodes = [];
    
    // Calculate how many codes to assign to each tier
    const tierDistribution = tiers.map(tier => {
      return Math.floor(quantity * (tier.probability / 100));
    });
    
    // Adjust for rounding errors
    let sum = tierDistribution.reduce((a, b) => a + b, 0);
    if (sum < quantity) {
      tierDistribution[0] += (quantity - sum);
    }
    
    // Generate codes for each tier
    tiers.forEach((tier, index) => {
      for (let i = 0; i < tierDistribution[index]; i++) {
        const scratchCode = generateScratchCode();
        const discountCode = generateDiscountCode();
        
        newCodes.push({
          scratchCode: scratchCode,
          discountCode: discountCode,
          discountValue: tier.discountValue,
          tierNumber: tier.tierNumber,
          used: false,
          dateCreated: new Date().toISOString(),
          dateRedeemed: null,
          userInfo: null
        });
      }
    });
    
    // In a production environment, we would call the Shopify API here
    // For development, we'll use localStorage
    saveToLocalStorage(newCodes);
    
    // Display codes
    displayCodes(newCodes);
    
    // Show results panel
    resultsPanel.style.display = 'block';
  });
  
  // Temporary function to save to localStorage
  function saveToLocalStorage(newCodes) {
    // Get existing codes
    const existingCodes = JSON.parse(localStorage.getItem('zenpur_discount_codes') || '[]');
    
    // Save combined codes
    localStorage.setItem('zenpur_discount_codes', JSON.stringify([...existingCodes, ...newCodes]));
    
    // In production, replace with API call:
    /*
    fetch('/api/discount-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codes: newCodes })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    */
  }
  
  // Display codes in table
  function displayCodes(codes) {
    codesTable.innerHTML = '';
    
    codes.forEach(code => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${code.scratchCode}</td>
        <td>${code.discountCode}</td>
        <td>${code.discountValue}%</td>
        <td>${code.tierNumber}</td>
        <td>${code.used ? 'Used' : 'Available'}</td>
      `;
      codesTable.appendChild(row);
    });
  }
  
  // Handle export button
  exportButton.addEventListener('click', function() {
    const codes = JSON.parse(localStorage.getItem('zenpur_discount_codes') || '[]');
    
    // Create CSV content
    let csv = 'Scratch Card Code,Discount Code,Discount Value,Tier,Status\n';
    codes.forEach(code => {
      csv += `${code.scratchCode},${code.discountCode},${code.discountValue}%,${code.tierNumber},${code.used ? 'Used' : 'Available'}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'zenpur_discount_codes.csv');
    a.click();
  });
  
  // Initialize - load and display any existing codes
  function initialize() {
    const existingCodes = JSON.parse(localStorage.getItem('zenpur_discount_codes') || '[]');
    if (existingCodes.length > 0) {
      displayCodes(existingCodes);
      resultsPanel.style.display = 'block';
    }
  }
  
  // Check if running in Shopify Admin iframe
  function isInShopifyAdmin() {
    try {
      return window.top !== window.self;
    } catch (e) {
      return true;
    }
  }
  
  // Add debug button in development
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Check Database';
    debugButton.type = 'button';
    debugButton.style.marginTop = '10px';
    debugButton.className = 'btn';
    debugButton.style.marginLeft = '10px';
    debugButton.onclick = function() {
      const codes = JSON.parse(localStorage.getItem('zenpur_discount_codes') || '[]');
      console.log('Current database contents:', codes);
      alert(`Database contains ${codes.length} codes. Check console for details.`);
    };
    
    document.querySelector('.btn').parentNode.insertBefore(debugButton, null);
  }
  
  // Run initialization
  initialize();
});
