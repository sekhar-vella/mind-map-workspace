import React from "react";

function Tree({ node, level = 0 }) {
  if (!node) return null;

  return (
    <div
      className="tree-item"
      style={{ marginLeft: level * 18 }}
    >
      <span className="folder">📁</span>
      {node.name}
      {node.children &&
        node.children.map(child => (
          <Tree key={child._id} node={child} level={level + 1} />
        ))}
    </div>
  );
}

export default Tree;
