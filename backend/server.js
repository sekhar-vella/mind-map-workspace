console.log("SERVER FILE LOADED");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// MongoDB Connection
// =====================
mongoose
  .connect("mongodb://127.0.0.1:27017/mindmap")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// =====================
// SCHEMAS
// =====================

// Node Schema (Graph – Adjacency List)
const nodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Node",
    default: null,
  },
});

// Index for fast tree queries
nodeSchema.index({ parentId: 1 });

const Node = mongoose.model("Node", nodeSchema);

// History Schema (Event Sourcing)
const historySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["create", "delete", "move"],
    required: true,
  },
  nodeId: mongoose.Schema.Types.ObjectId,
  name: String,
  oldParentId: mongoose.Schema.Types.ObjectId,
  newParentId: mongoose.Schema.Types.ObjectId,
  time: { type: Date, default: Date.now },
});

// Index for time travel
historySchema.index({ time: 1 });

const History = mongoose.model("History", historySchema);

// =====================
// LOST & FOUND ENSURE
// =====================
async function ensureLostAndFound() {
  const exists = await Node.findOne({ name: "Lost & Found", parentId: null });
  if (!exists) {
    await Node.create({ name: "Lost & Found", parentId: null });
    console.log("Lost & Found created");
  }
}
ensureLostAndFound();

// =====================
// ROUTES
// =====================

// =====================
// GET ALL NODES (FOR PERFORMANCE VIEW)
// =====================
app.get("/nodes", async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get("/", (req, res) => {
  res.send("Mind Map Backend Running");
});

// =====================
// SAFE CREATE NODE (Challenge B)
// =====================
app.post("/node/create", async (req, res) => {
  try {
    const { name, parentId } = req.body;
    let finalParent = null;

    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      const parent = await Node.findById(parentId);
      if (parent) {
        finalParent = parentId;
      } else {
        const lost = await Node.findOne({ name: "Lost & Found" });
        finalParent = lost._id;
      }
    }

    const node = await Node.create({
      name,
      parentId: finalParent,
    });

    await History.create({
      action: "create",
      nodeId: node._id,
      name,
      newParentId: finalParent,
    });

    res.json({ message: "Node created safely", node });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// DELETE NODE (LOGGED)
// =====================
app.delete("/node/:id", async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).send("Node not found");

    await History.create({
      action: "delete",
      nodeId: node._id,
      name: node.name,
      oldParentId: node.parentId,
    });

    await Node.deleteOne({ _id: node._id });
    res.send("Node deleted safely");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// MOVE NODE (CONFLICT SAFE)
// =====================
app.post("/node/move", async (req, res) => {
  try {
    const { nodeId, newParentId } = req.body;

    const node = await Node.findById(nodeId);
    if (!node) return res.status(404).send("Node not found");

    let finalParent = null;
    const parentExists = await Node.findById(newParentId);

    if (parentExists) {
      finalParent = newParentId;
    } else {
      const lost = await Node.findOne({ name: "Lost & Found" });
      finalParent = lost._id;
    }

    await History.create({
      action: "move",
      nodeId,
      oldParentId: node.parentId,
      newParentId: finalParent,
    });

    node.parentId = finalParent;
    await node.save();

    res.send("Node moved safely");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// TREE FETCH (Aggregation – Challenge A)
// =====================
app.get("/tree/:rootId", async (req, res) => {
  try {
    const rootId = new mongoose.Types.ObjectId(req.params.rootId);

    const tree = await Node.aggregate([
      { $match: { _id: rootId } },
      {
        $graphLookup: {
          from: "nodes",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentId",
          as: "descendants",
        },
      },
    ]);

    res.json(tree[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ⏳ TIME TRAVEL (Challenge D)
// =====================
app.get("/time-travel", async (req, res) => {
  try {
    const time = new Date(req.query.time);

    const events = await History.find({ time: { $lte: time } }).sort({
      time: 1,
    });

    const map = {};

    events.forEach((e) => {
      if (e.action === "create") {
        map[e.nodeId] = {
          _id: e.nodeId,
          name: e.name,
          parentId: e.newParentId,
          children: [],
        };
      }

      if (e.action === "delete") {
        delete map[e.nodeId];
      }

      if (e.action === "move" && map[e.nodeId]) {
        map[e.nodeId].parentId = e.newParentId;
      }
    });

    Object.values(map).forEach((n) => {
      if (n.parentId && map[n.parentId]) {
        map[n.parentId].children.push(n);
      }
    });

    const root = Object.values(map).find((n) => !n.parentId);
    res.json(root);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SERVER START
// =====================
app.listen(5001, () => {
  console.log("Server running on port 5001");
});
