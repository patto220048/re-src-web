/**
 * Utilities for processing folder structures
 */

export function buildFolderTree(flatList) {
  const map = {};
  const roots = [];

  flatList.forEach((f) => {
    map[f.id] = { ...f, children: [], path: f.name };
  });

  flatList.forEach((f) => {
    if (f.parentId && map[f.parentId]) {
      const parent = map[f.parentId];
      map[f.id].path = `${parent.path}/${f.name}`;
      parent.children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });

  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach((n) => {
      if (n.children.length > 0) sortChildren(n.children);
    });
  };
  sortChildren(roots);

  // Recursive count calculation
  const calculateRecursiveCount = (node) => {
    let total = node.resourceCount || 0;
    node.children.forEach(child => {
      total += calculateRecursiveCount(child);
    });
    node.totalResourceCount = total;
    return total;
  };
  roots.forEach(root => calculateRecursiveCount(root));

  return roots;
}
