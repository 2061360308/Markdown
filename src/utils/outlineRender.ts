export interface TreeNode {
  label: string;
  id: string;
  level: string;
  children?: TreeNode[];
}

interface OutlineItem {
  level: number;
  text: string;
  id: string;
}

export const extractOutlineFromElement = (
  element: HTMLElement
): OutlineItem[] => {
  const outline: OutlineItem[] = [];

  function traverse(node: HTMLElement) {
    for (const child of Array.from(node.children)) {
      if (child.tagName.match(/^H[1-6]$/)) {
        const level = parseInt(child.tagName[1]);
        const text = child.textContent?.trim() || "";
        const id = child.id || "";
        if (text !== "") {
          outline.push({ level, text, id });
        }
      }
      traverse(child as HTMLElement);
    }
  }

  traverse(element);
  return outline;
};

export const outlineRender = (contentElement: HTMLElement): TreeNode[] => {
  const outline = extractOutlineFromElement(contentElement);
  if (outline.length === 0) {
    return [];
  }

  const buildTree = (outline: OutlineItem[]): TreeNode[] => {
    const root: TreeNode[] = [];
    const stack: { children: TreeNode[]; level: number }[] = [{ children: root, level: 0 }];

    outline.forEach((item) => {
      const node: TreeNode = { label: item.text, id: item.id, level: `H${item.level}`, children: [] };
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(node);
      stack.push({ children: node.children!, level: item.level });
    });

    return root;
  };

  return buildTree(outline);
};