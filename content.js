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
      <span>JavaScript Console</span>
      <button class="minimize-btn">_</button>
      <button class="close-btn">×</button>
    </div>
    <div class="console-body">
      <div class="console-output"></div>
      <div class="console-input">
        <textarea placeholder="Enter JavaScript code..."></textarea>
        <button class="run-btn">Run</button>
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
}

function initializeEventListeners() {
  const fab = document.getElementById('custom-inspect-fab');
  const console = document.getElementById('custom-inspect-console');
  const inspectPanel = document.getElementById('custom-inspect-panel');

  // FAB menu toggle
  fab.querySelector('.fab-icon').addEventListener('click', () => {
    fab.classList.toggle('active');
  });

  // Console button
  document.getElementById('console-btn').addEventListener('click', () => {
    console.style.display = 'block';
    fab.classList.remove('active');
  });

  // Inspect button
  document.getElementById('inspect-btn').addEventListener('click', () => {
    inspectPanel.style.display = 'block';
    fab.classList.remove('active');
    enableInspectMode();
  });

  // Make console draggable
  makeDraggable(console);
  makeDraggable(inspectPanel);

  // Console functionality
  const runBtn = console.querySelector('.run-btn');
  const textarea = console.querySelector('textarea');
  const output = console.querySelector('.console-output');

  runBtn.addEventListener('click', () => {
    try {
      const result = eval(textarea.value);
      output.innerHTML += `<div class="console-line">
        <span class="input">> ${textarea.value}</span>
        <span class="output">${result}</span>
      </div>`;
    } catch (error) {
      output.innerHTML += `<div class="console-line error">
        <span class="input">> ${textarea.value}</span>
        <span class="error">${error}</span>
      </div>`;
    }
    textarea.value = '';
  });

  // Close and minimize buttons
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