// Listen for extension icon click
chrome.action.onClicked.addListener(async (tab) => {

  // Inject the main content script and styles
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