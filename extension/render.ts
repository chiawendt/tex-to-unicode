import { render } from "../lib/index.js";
import type { Options } from "../lib/index.js";

chrome.storage.local.get(["options"], (result: { options?: Options }) => {
  const options = result.options || {};
  if (document.activeElement) {
    render(document.activeElement as HTMLElement, options);
  }
});
