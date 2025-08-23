import "./main.css";
import * as TexToUnicode from "../lib/index.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the symbol table
  function renderSymbols() {
    const symbols = TexToUnicode.symbols;
    return Object.entries(symbols)
      .map(
        ([a, b]) =>
          `<div class="symbol-entry">
        <span class="symbol-key">${a}</span>
        <span class="symbol-value">${b}</span>
      </div>`
      )
      .join("\n");
  }

  const symbolTable = document.querySelector(".symbol-table");
  if (symbolTable) {
    symbolTable.innerHTML = renderSymbols();
  }

  // Setup the textarea demo
  const textarea = document.querySelector(".try-here") as HTMLTextAreaElement;
  if (textarea) {
    textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "w" && (ev.altKey === true || ev.ctrlKey)) {
        TexToUnicode.render(textarea, { subscripts: true });
      }
    });
  }
});
