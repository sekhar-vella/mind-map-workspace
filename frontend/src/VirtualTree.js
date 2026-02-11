import { useState } from "react";

const ITEM_HEIGHT = 28;
const VISIBLE_COUNT = 20;

function VirtualTree({ nodes }) {
  const [start, setStart] = useState(0);
  const visible = nodes.slice(start, start + VISIBLE_COUNT);

  return (
    <div
      style={{ height: 320, overflowY: "auto", position: "relative" }}
      onScroll={(e) =>
        setStart(Math.floor(e.target.scrollTop / ITEM_HEIGHT))
      }
    >
       <div style={{ height: nodes.length * ITEM_HEIGHT }}>

        {visible.map((n, i) => (
          <div
            key={n._id}
            className="tree-item"
            style={{
              position: "absolute",
              top: (start + i) * ITEM_HEIGHT,
              marginLeft: (n.depth || 0) * 18,
            }}
          >
            <span className="folder">📁</span>
            {n.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualTree;
