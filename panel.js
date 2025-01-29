var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page",
  })
  
  document.getElementById("getInfo").addEventListener("click", () => {
    backgroundPageConnection.postMessage({
      action: "getPageInfo",
      tabId: chrome.devtools.inspectedWindow.tabId,
    })
  })
  
  backgroundPageConnection.onMessage.addListener((message) => {
    if (message.action === "pageInfo") {
      var pageInfoDiv = document.getElementById("pageInfo")
      pageInfoDiv.innerHTML = `
        <p>URL: ${message.data.url}</p>
        <p>Title: ${message.data.title}</p>
      `
    }
  })
  
  