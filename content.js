// Create and inject the FAB and console elements
function createFloatingUI() {
  // Create FAB
  const fab = document.createElement('div');
  fab.id = 'custom-inspect-fab';
  fab.innerHTML = `
    <div class="fab-icon">🔍</div>
    <div class="fab-menu">
      <button id="console-btn">Console</button>
      <button id="inspect-btn">Inspect</button>
    </div>
  `;
  document.body.appendChild(fab);

  // Create floating console
  const console = document.createElement('div');
  console.id = 'custom-inspect-console';
  console.innerHTML = `
    <div class="console-header">
      <span>Browser Console</span>
      <button class="minimize-btn">_</button>
      <button class="close-btn">×</button>
    </div>
    <div class="console-body">
      <div class="console-output"></div>
      <div class="console-filters">
        <label><input type="checkbox" data-level="log" checked> Log</label>
        <label><input type="checkbox" data-level="info" checked> Info</label>
        <label><input type="checkbox" data-level="warn" checked> Warn</label>
        <label><input type="checkbox" data-level="error" checked> Error</label>
      </div>
    </div>
  `;
  document.body.appendChild(console);

  // Create inspect panel
  const inspectPanel = document.createElement('div');
  inspectPanel.id = 'custom-inspect-panel';
  inspectPanel.innerHTML = `
    <div class="panel-header">
      <span>Inspect Elements</span>
      <button class="minimize-btn">_</button>
      <button class="close-btn">×</button>
    </div>
    <div class="panel-body">
      <div class="element-info"></div>
      <div class="styles-section">
        <h3>Styles</h3>
        <div class="styles-content"></div>
      </div>
    </div>
  `;
  document.body.appendChild(inspectPanel);

  initializeEventListeners();
  interceptConsole();
}

function interceptConsole() {
  const consoleOutput = document.querySelector('.console-output');
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace
  };

  function getStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack.split('\n')
        .slice(2) // Remove the error message and getStackTrace call
        .map(line => line.trim())
        .join('\n');
    }
  }

  function formatValue(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'function') return value.toString();
    if (typeof value === 'object') {
      try {
        // Handle circular references
        const seen = new WeakSet();
        return JSON.stringify(value, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        }, 2);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  }

  function createConsoleEntry(level, args, stack) {
    const entry = document.createElement('div');
    entry.className = `console-line ${level}`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    // Format each argument
    const formattedArgs = Array.from(args).map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
      }
      return formatValue(arg);
    });

    // Create entry content
    let content = formattedArgs.join(' ');
    
    // Add file and line info from stack if available
    if (stack) {
      const stackLines = stack.split('\n');
      if (stackLines[0]) {
        const match = stackLines[0].match(/at\s+(?:\w+\s+)?\(?(.*):(\d+):(\d+)/);
        if (match) {
          const [, file, line, col] = match;
          const fileInfo = `${file.split('/').pop()}:${line}`;
          content += `\n<span class="stack-trace">${fileInfo}</span>`;
        }
      }
    }

    entry.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="content">${content}</span>
    `;
    
    // Add expandable stack trace
    if (stack && level === 'error') {
      const stackTrace = document.createElement('div');
      stackTrace.className = 'stack-trace hidden';
      stackTrace.textContent = stack;
      entry.appendChild(stackTrace);
      
      entry.addEventListener('click', () => {
        stackTrace.classList.toggle('hidden');
      });
    }
    
    return entry;
  }

  // Override console methods
  Object.keys(originalConsole).forEach(level => {
    console[level] = (...args) => {
      // Get stack trace before calling original
      const stack = level === 'error' ? getStackTrace() : null;
      
      // Call original console method
      originalConsole[level].apply(console, args);
      
      // Create and append entry
      const entry = createConsoleEntry(level, args, stack);
      consoleOutput.appendChild(entry);
      
      // Auto-scroll to bottom
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };
  });

  // Add some additional styling
  const style = document.createElement('style');
  style.textContent = `
    .console-line {
      position: relative;
      padding: 4px 8px;
      border-bottom: 1px solid #eee;
      font-family: monospace;
      white-space: pre-wrap;
    }
    
    .stack-trace {
      margin-top: 4px;
      padding: 4px 0 4px 20px;
      color: #666;
      font-size: 0.9em;
    }
    
    .stack-trace.hidden {
      display: none;
    }
    
    .console-line.error {
      background-color: rgba(255, 0, 0, 0.1);
    }
    
    .console-line.warn {
      background-color: rgba(255, 165, 0, 0.1);
    }
    
    .console-line.info {
      color: #2196F3;
    }
  `;
  document.head.appendChild(style);

  // Handle existing console filters
  document.querySelectorAll('.console-filters input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const level = e.target.dataset.level;
      const show = e.target.checked;
      document.querySelectorAll(`.console-line.${level}`).forEach(entry => {
        entry.style.display = show ? 'block' : 'none';
      });
    });
  });

  // Intercept window errors
  window.addEventListener('error', function(event) {
    const entry = createConsoleEntry('error', [event.error || event.message], event.error?.stack);
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  });

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const entry = createConsoleEntry('error', ['Unhandled Promise Rejection:', event.reason], event.reason?.stack);
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  });
}

document.addEventListener('console-message', function(event) {
  const msg = event.detail;
  const entry = createConsoleEntry(msg.level, msg.args, msg.stack);
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
});

function initializeEventListeners() {
  const fab = document.getElementById('custom-inspect-fab');
  const console = document.getElementById('custom-inspect-console');
  const inspectPanel = document.getElementById('custom-inspect-panel');

  fab.querySelector('.fab-icon').addEventListener('click', () => {
    fab.classList.toggle('active');
  });

  document.getElementById('console-btn').addEventListener('click', () => {
    console.style.display = 'block';
    fab.classList.remove('active');
  });

  document.getElementById('inspect-btn').addEventListener('click', () => {
    inspectPanel.style.display = 'block';
    fab.classList.remove('active');
    enableInspectMode();
  });

  makeDraggable(console);
  makeDraggable(inspectPanel);

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('#custom-inspect-console, #custom-inspect-panel').style.display = 'none';
    });
  });

  document.querySelectorAll('.minimize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('#custom-inspect-console, #custom-inspect-panel');
      panel.classList.toggle('minimized');
    });
  });
}

function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  element.querySelector('.panel-header, .console-header').onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function enableInspectMode() {
  const panel = document.getElementById('custom-inspect-panel');
  const elementInfo = panel.querySelector('.element-info');
  const stylesContent = panel.querySelector('.styles-content');
  
  document.body.style.cursor = 'crosshair';
  
  function inspectElement(e) {
    e.preventDefault();
    const element = document.elementFromPoint(e.clientX, e.clientY);
    
    elementInfo.innerHTML = `
      <div>Tag: ${element.tagName.toLowerCase()}</div>
      <div>ID: ${element.id || 'none'}</div>
      <div>Classes: ${element.className || 'none'}</div>
    `;

    const styles = window.getComputedStyle(element);
    let stylesHtml = '';
    for (let prop of styles) {
      stylesHtml += `<div>${prop}: ${styles.getPropertyValue(prop)}</div>`;
    }
    stylesContent.innerHTML = stylesHtml;

    document.removeEventListener('click', inspectElement, true);
    document.body.style.cursor = 'default';
  }

  document.addEventListener('click', inspectElement, true);
}

// Initialize the UI
createFloatingUI();