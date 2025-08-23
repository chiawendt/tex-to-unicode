/** Used to find all DOM nodes in window.getSelection() */
export function findNodesBetweenNodes(u: Node, v: Node): Node[] {
  const ancestor = findLowestCommonAncestor(u, v);
  const childrenList = findChildrenList(ancestor);
  const [i, j] = [childrenList.indexOf(u), childrenList.indexOf(v)].sort();
  return childrenList.slice(i, j + 1);
}

function findAncestorChain(node: Node): Node[] {
  const chain: Node[] = [];
  let currentNode: Node | null = node;
  chain.push(currentNode);
  while (currentNode?.parentNode) {
    currentNode = currentNode.parentNode;
    chain.push(currentNode);
  }
  return chain.reverse();
}

export function findLowestCommonAncestor(u: Node, v: Node): Node {
  const uChain = findAncestorChain(u);
  const vChain = findAncestorChain(v);

  let i = 0;
  for (; i < uChain.length; i++) {
    if (uChain[i] !== vChain[i]) {
      break;
    }
  }
  return uChain[i - 1];
}

function findChildrenList(node: Node): Node[] {
  const list: Node[] = [];
  const find = (n: Node | null) => {
    if (!n) return;
    list.push(n);
    for (const child of Array.from(n.childNodes || [])) {
      find(child);
    }
  };
  find(node);
  return list;
}
