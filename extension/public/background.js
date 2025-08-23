chrome.commands.onCommand.addListener(async (command) => {
  if (command === "convert") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/render.js"],
    });
  }
});

chrome.storage.local.get(["options"], ({ options = {} }) => {
  const opt = {
    subscripts: typeof options.subscripts === "boolean" ? options.subscripts : false,
  };

  chrome.storage.local.set({ options: opt });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ options: { subscripts: false } });
});
