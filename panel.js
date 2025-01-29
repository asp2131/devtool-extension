// Create a connection to the background page
let backgroundPageConnection = chrome.runtime.connect({
  name: "devtools-panel"
});

// Initialize preserve log state
let preserveLog = false;

// Connect to the background page and set up message handling
backgroundPageConnection.onMessage.addListener(function(message) {
  if (message.type === 'console') {
    handleConsoleMessage(message);
  } else if (message.action === "pageInfo") {
    updatePageInfo(message.data);
  }
});

// Send message to background page that we're ready to receive console messages
backgroundPageConnection.postMessage({
  action: "init",
  tabId: chrome.devtools.inspectedWindow.tabId
});

// Handle console messages
function handleConsoleMessage(message) {
  const consoleOutput = document.getElementById('consoleOutput');
  const entry = createConsoleEntry(message);
  
  if (!preserveLog && consoleOutput.children.length > 1000) {
    consoleOutput.removeChild(consoleOutput.firstChild);
  }
  
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Create console entry element
function createConsoleEntry(message) {
  const entry = document.createElement('div');
  entry.className = `console-line ${message.level}`;
  
  const timestamp = new Date().toLocaleTimeString();
  const formattedContent = formatConsoleContent(message.content);
  
  entry.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="content">${formattedContent}</span>
  `;
  
  return entry;
}

// Format console content based on type
function formatConsoleContent(content) {
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  }
  return String(content);
}

// Update page info
function updatePageInfo(data) {
  const pageInfo = document.getElementById('pageInfo');
  pageInfo.innerHTML = `
    <h3>Page Information</h3>
    <p>URL: ${data.url}</p>
    <p>Title: ${data.title}</p>
  `;
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Clear console button
  document.getElementById('clearConsole').addEventListener('click', function() {
    document.getElementById('consoleOutput').innerHTML = '';
  });

  // Preserve log toggle
  document.getElementById('preserveLog').addEventListener('click', function() {
    preserveLog = !preserveLog;
    this.classList.toggle('active');
  });

  // Console level filters
  document.querySelectorAll('.console-filters input').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const level = this.dataset.level;
      const show = this.checked;
      document.querySelectorAll(`.console-line.${level}`).forEach(entry => {
        entry.style.display = show ? 'block' : 'none';
      });
    });
  });

  // Console input execution
  const consoleInput = document.getElementById('consoleInput');
  document.getElementById('executeCode').addEventListener('click', function() {
    const code = consoleInput.value;
    chrome.devtools.inspectedWindow.eval(code, function(result, isException) {
      if (isException) {
        handleConsoleMessage({
          level: 'error',
          content: isException.value || isException.toString()
        });
      } else {
        handleConsoleMessage({
          level: 'log',
          content: result
        });
      }
    });
    consoleInput.value = '';
  });

  // Handle enter key in console input
  consoleInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('executeCode').click();
    }
  });
});