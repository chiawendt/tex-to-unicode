chrome.storage.local.get(["options"], ({ options = {} }) => {
  Array.from(document.querySelectorAll(".options input")).map((input) => {
    if (input.name === "subscripts") {
      input.checked = Boolean(options.subscripts);
    }
  });
});

chrome.commands.getAll((commands) => {
  for (const e of Array.from(document.querySelectorAll(".shortcut"))) {
    e.innerHTML = commands[1].shortcut || "unset";
  }
});

document.querySelector("body").addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    chrome.tabs.create({ url: event.target.href });
    return false;
  }
});

document.querySelector(".options").addEventListener("input", () => {
  chrome.storage.local.set({ options: getOptions() }, () => {
    console.log(getOptions());
  });
});

function getOptions() {
  const subscripts = document.querySelector(".options [name=subscripts]").checked;

  return {
    subscripts,
  };
}
