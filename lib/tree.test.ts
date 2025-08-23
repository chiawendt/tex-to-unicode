import * as tree from "./tree.js";

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
