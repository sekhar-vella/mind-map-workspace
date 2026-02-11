import React, { useEffect, useState } from "react";
import Tree from "./Tree";
import VirtualTree from "./VirtualTree";
import TimeTravel from "./TimeTravel";
import "./App.css";

function App() {
  const [tree, setTree] = useState(null);
  const [nodes, setNodes] = useState([]);

  const ROOT_ID = "69884fa79fa935130f811a7c";

  // 🌳 NORMAL TREE (Challenge A)
  useEffect(() => {
    fetch(`http://localhost:5001/tree/${ROOT_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error("Tree fetch failed");
        return res.json();
      })
      .then((data) => setTree(data))
      .catch(err => console.error("Tree error:", err));
  }, []);
  

  // ⚡ ALL NODES → Virtualization (Challenge C)
  useEffect(() => {
    fetch("http://localhost:5001/nodes")
      .then((res) => {
        if (!res.ok) throw new Error("Nodes fetch failed");
        return res.json();
      })
      .then((data) => setNodes(data))
      .catch(err => console.error("Nodes error:", err));
  }, []);
  
  
  // ⏳ TIME TRAVEL (Challenge D)
  const handleTimeTravel = (time) => {
    // 🔥 VERY IMPORTANT GUARD
    if (!time || time.trim() === "") return;
  
    fetch(`http://localhost:5001/time-travel?time=${time}`)
      .then((res) => {
        if (!res.ok) throw new Error("Time travel failed");
        return res.json();
      })
      .then((data) => setTree(data))
      .catch((err) => {
        console.error("Time travel fetch error:", err);
      });
  };
  
  

  return (
    <div className="app">
      <header className="header">🌳 Mind Map Workspace</header>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Features</h3>
          <p>✓ Graph in MongoDB</p>
          <p>✓ Offline Safe</p>
          <p>✓ Virtualization</p>
          <p>✓ Time Travel</p>
        </aside>

        {/* MAIN CONTENT */}
        <main className="content">
          {/* TIME TRAVEL */}
          <section className="section">
            <TimeTravel onChange={handleTimeTravel} />
          </section>

          {/* TREE VIEW */}
          <section className="section tree-box">
            <h2>🌳 Tree View</h2>
            {tree && tree.children && tree.children.map(child => (
  <Tree key={child._id} node={child} />
))}

          </section>

          {/* PERFORMANCE VIEW */}
          <section className="section perf-box">
            <h2>⚡ Performance View (10,000+ nodes)</h2>
            <VirtualTree nodes={nodes} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
