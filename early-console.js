// Only set up console interception if not already done
if (!window.__consoleIntercepted) {
  window.__consoleIntercepted = true;
  
  // Store original console methods
  window.__originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    trace: console.trace.bind(console)
  };

  // Store messages until UI is ready
  window.__consoleMessages = [];

  // Override console methods to store messages
  Object.keys(window.__originalConsole).forEach(level => {
    console[level] = (...args) => {
      // Check if this is our own log to prevent recursion
      const isInternalLog = new Error().stack.includes('early-console.js');
      if (!isInternalLog) {
        // Store message
        window.__consoleMessages.push({
          level,
          args,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
        
        // Call original
        window.__originalConsole[level].apply(console, args);
      }
    };
  });
}