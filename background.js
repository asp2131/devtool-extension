chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "devtools-page") {
      port.onMessage.addListener((message) => {
        if (message.action === "getPageInfo") {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                function: getPageInfo,
              },
              (results) => {
                port.postMessage({ action: "pageInfo", data: results[0].result })
              },
            )
          })
        }
      })
    }
  })
  
  function getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      // Add more information as needed
    }
  }
  
  