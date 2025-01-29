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