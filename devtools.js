// Create the panel
chrome.devtools.panels.create(
  "Console+",
  null,
  "panel.html",
  function(panel) {
    let _window;
    
    panel.onShown.addListener(function(panelWindow) {
      _window = panelWindow;
      // Initialize the panel when it's shown
      if (_window) {
        // You can initialize panel-specific functionality here
      }
    });

    panel.onHidden.addListener(function() {
      // Cleanup when panel is hidden
    });
  }
);

// Create connection to background page
let backgroundPageConnection = chrome.runtime.connect({
  name: "devtools"
});

// Listen to messages from the background page
backgroundPageConnection.onMessage.addListener(function(message) {
  if (message.tabId === chrome.devtools.inspectedWindow.tabId) {
    // Handle messages from background page
  }
});

// Notify background page that DevTools is open
backgroundPageConnection.postMessage({
  name: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

// Use eval to inject a console observer
chrome.devtools.inspectedWindow.eval(
  `(function() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    function sendToDevTools(method, args) {
      window.postMessage({
        source: 'console-intercept',
        method: method,
        args: JSON.stringify(args)
      }, '*');
    }

    // Override console methods
    console.log = function() {
      sendToDevTools('log', arguments);
      originalConsole.log.apply(console, arguments);
    };
    console.info = function() {
      sendToDevTools('info', arguments);
      originalConsole.info.apply(console, arguments);
    };
    console.warn = function() {
      sendToDevTools('warn', arguments);
      originalConsole.warn.apply(console, arguments);
    };
    console.error = function() {
      sendToDevTools('error', arguments);
      originalConsole.error.apply(console, arguments);
    };
  })();`,
  { useContentScriptContext: true }
);