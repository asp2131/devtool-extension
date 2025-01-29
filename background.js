// Listen for extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // First inject early console interceptor
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function() {
      // Store original console methods
      window.__originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        trace: console.trace
      };
      
      // Store messages until UI is ready
      window.__consoleMessages = [];
      
      // Override console methods to store messages
      Object.keys(window.__originalConsole).forEach(level => {
        console[level] = (...args) => {
          // Store message
          window.__consoleMessages.push({
            level,
            args,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
          });
          
          // Call original
          window.__originalConsole[level].apply(console, args);
        };
      });
    }
  });

  // Then inject the main content script and styles
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['content.css']
  });

  // Finally, inject script to replay stored messages
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function() {
      // Wait a bit for UI to be ready
      setTimeout(() => {
        const consoleOutput = document.querySelector('.console-output');
        if (consoleOutput && window.__consoleMessages) {
          window.__consoleMessages.forEach(msg => {
            const event = new CustomEvent('console-message', {
              detail: msg
            });
            document.dispatchEvent(event);
          });
          // Clear stored messages
          window.__consoleMessages = [];
        }
      }, 500);
    }
  });
});