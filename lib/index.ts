import { findNodesBetweenNodes } from "./tree.js";
import { type TexNode, type ASTNode, parser } from "./parser.js";
import { symbols } from "./symbols.js";

export interface Options {
  subscripts?: boolean;
}

/**
 * Check if two interval overlaps.
 */
function overlaps([a, b]: [number, number], [c, d]: [number, number]): boolean {
  return (
    (c <= a && a < d) || (c <= b - 1 && b - 1 < d) || (a <= c && c < b) || (a <= d - 1 && d - 1 < b)
  );
}

function debrackets(s: string): string {
  s = s.trim();
  if (s[0] === "{" && s[s.length - 1] === "}") {
    return debrackets(s.slice(1, s.length - 1));
  }
  return s;
}

function printSource(source: string, node: ASTNode): string {
  return source.slice(node.start, node.end);
}

function printNode(source: string, node: TexNode, options: Options = {}): string {
  switch (node.type) {
    case "PlainText":
    case "CurlyGroup": {
      return printSource(source, node);
    }
    case "UnaryMacro": {
      const argumentText = printSource(source, node.argument);

      const key =
        node.macro === "\\not"
          ? `${node.macro}${debrackets(argumentText)}`
          : `${node.macro}{${debrackets(argumentText)}}`;

      return symbols[key] || printSource(source, node);
    }
    case "NullaryMacro": {
      return symbols[node.macro] || printSource(source, node);
    }
    case "Subscript":
    case "Superscript": {
      if (!options.subscripts) {
        return printSource(source, node);
      }

      let r = "";
      for (const c of debrackets(node.content)) {
        const h = node.type === "Subscript" ? "_" : "^";
        const v = symbols[`${h}${c}`];
        if (v === undefined) {
          return printSource(source, node);
        }
        r += v;
      }
      return r;
    }
  }

  console.error(node);
  throw new Error("unhandled case");
}

function print(
  source: string,
  ast: TexNode,
  selectStart: number,
  selectEnd: number,
  options: Options = {}
) {
  const nodes = (ast as any).body as ASTNode[];
  let cursor = -1;
  let output = "";
  for (const node of nodes) {
    if (overlaps([selectStart, selectEnd], [node.start, node.end])) {
      output += printNode(source, node as TexNode, options);
    } else {
      output += source.slice(node.start, node.end);
    }

    if (node.start < selectEnd && selectEnd <= node.end) {
      cursor = node.type !== "PlainText" ? output.length : output.length - (node.end - selectEnd);
    }
  }

  return {
    text: output,
    cursor,
  };
}

/** convert tex to unicode text */
export function convert(
  text: string,
  selectStart: number,
  selectEnd: number,
  options: Options = {}
): { text: string; cursor: number } {
  selectEnd = Math.min(selectEnd, text.length);
  // The parser is not supposed to throw error by design.
  const ast = parser.tryParse(text);
  return print(text, ast, selectStart, selectEnd, options);
}

/** Convert TeX in textarea or contentEditable, and then set cursor. */
export function render(element: HTMLElement, options: Options): void {
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    const textarea = element as HTMLInputElement | HTMLTextAreaElement;
    const selectionStart = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || 0;
    const { text, cursor } = convert(textarea.value, selectionStart, selectionEnd, options);
    textarea.select();
    element.ownerDocument.execCommand("insertText", false, text);
    textarea.selectionStart = textarea.selectionEnd = cursor;
  }
  // contenteditable elements: ex. Gmail message body.
  else if (element.contentEditable) {
    const selection = element.ownerDocument.getSelection();
    if (!selection) {
      return;
    }
    if (!selection.anchorNode || !selection.focusNode) {
      return;
    }
    const nodesBetweenNodes = findNodesBetweenNodes(selection.anchorNode, selection.focusNode);

    const [startNode] = nodesBetweenNodes;
    const endNode = nodesBetweenNodes[nodesBetweenNodes.length - 1];

    const selectionIsForward =
      startNode === selection.anchorNode && selection.anchorOffset <= selection.focusOffset;

    const [startCursor, endCursor] = selectionIsForward
      ? [selection.anchorOffset, selection.focusOffset]
      : [selection.focusOffset, selection.anchorOffset];

    const TEXT_NODE_TYPE = 3;
    let _cursor;
    for (const node of nodesBetweenNodes) {
      if (node.nodeType === TEXT_NODE_TYPE) {
        const selectionStart = node === nodesBetweenNodes[0] ? startCursor : 0;
        const selectionEnd =
          node === nodesBetweenNodes[nodesBetweenNodes.length - 1]
            ? endCursor
            : node.nodeValue?.length || 0;
        const { text, cursor } = convert(
          node.nodeValue || "",
          selectionStart,
          selectionEnd,
          options
        );
        node.nodeValue = text;
        _cursor = cursor;
      }
    }

    selection.collapse(endNode, _cursor);
  }
}

export { symbols, parser };
