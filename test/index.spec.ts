/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

import { convert, render } from "../lib/index.js";
import parser from "../lib/parser.js";
import * as tree from "../lib/tree.js";

const testCases = [
  {
    tex: "a \\alpha, b \\beta",
    out: "a α, b \\beta",
    selection: [0, 4],
    cursor: 3,
  },
  {
    tex: "\\frac{\\alpha}{\\beta}",
    out: "\\frac{α}{β}",
    selection: [0, 20],
    cursor: 11,
  },
  {
    tex: "a \\in \\mathbb{R}",
    out: "a ∈ ℝ",
    selection: [0, 16],
    cursor: 5,
  },
  {
    tex: "\\not\\equiv",
    out: "≢",
    selection: [10, 10],
    cursor: 1,
  },
  {
    tex: "x_1^{abc}",
    out: "x₁ᵃᵇᶜ",
    selection: [0, 9],
    cursor: 5,
    options: {
      subscripts: true,
    },
  },
  {
    tex: "x_1^{abc}",
    out: "x_1^{abc}",
    options: {
      subscripts: false,
    },
  },
  {
    tex: "x_\\alpha",
    out: "x_α",
  },
  {
    tex: "x_\\alpha",
    out: "x_α",
  },
  {
    tex: "_{a!}",
    out: "_{a!}",
  },
  {
    tex: "\\mathbb{0} \\mathfrak{a}",
    out: "𝟘 𝔞",
  },
  {
    tex: "\\mathcal{T}",
    out: "𝒯",
  },
  {
    tex: "\\mathbb{1 2}",
    out: "\\mathbb{1 2}",
  },
  {
    tex: "\\mathbb\\alpha",
    out: "\\mathbb\\alpha",
  },
  {
    tex: "\\|",
    out: "‖",
  },
];

describe("convertText", () => {
  for (const t of testCases) {
    test(`convert ${t.tex}`, () => {
      const r = convert(t.tex, t.selection?.[0] ?? 0, t.selection?.[1] ?? t.tex.length, t.options);
      expect({ out: r.text, cursor: r.cursor }).toMatchObject({
        out: t.out,
        ...(t.cursor !== undefined ? { cursor: t.cursor } : {}),
      });
    });
  }
});

describe("Parser", () => {
  test("Should successfully parse \\\\^^__", () => {
    expect(parser.parse("\\\\^^__").type).toEqual("ParseOK");
  });
});

describe("Tree algorithms", () => {
  const Node = function (...args) {
    const res = { childNodes: Array.from(args) };
    for (const node of args) {
      node.parentNode = res;
    }
    return res;
  };

  test("findNodesBetweenNodes", () => {
    const u = { nodeValue: "u" } as Node;
    const v = { nodeValue: "v" } as Node;

    Node(Node(u, Node()), Node(), Node(Node(), v));

    const nodes = tree.findNodesBetweenNodes(u, v);

    expect(nodes).toHaveLength(6);

    expect(nodes[0]).toBe(u);

    expect(nodes[5]).toBe(v);
  });

  test("findLowestCommonAncestor", () => {
    const u = { nodeValue: "u" } as Node;
    const v = { nodeValue: "v" } as Node;

    const node = Node(Node(u), Node(Node(v)));

    expect(tree.findLowestCommonAncestor(u, v)).toBe(node);
  });
});

describe("DOM test", () => {
  test("Convert text in textarea", () => {
    document.body.innerHTML = `
      <textarea>\\alpha \\to \\beta</textarea>
    `;
    const textarea = document.querySelector("textarea")!;
    textarea.select();
    document.execCommand = function fakeExecCommand(_, __, text) {
      textarea.value = text || "";
      return false;
    };
    render(textarea, {});
    expect(textarea.value).toBe("α → β");
  });

  // Not testable because jsdom didn't implement document.getSelection()
  test.skip("convert text in contenteditable", () => {
    document.body.innerHTML = `
      <div contenteditable='true'>
        <div>\\alpha \\to </div>
        <div>\\beta</div>
      </div>
    `;
  });
});
