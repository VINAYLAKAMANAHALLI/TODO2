const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");
const authMiddleware = require("../middleware/authMiddleware");

// TEST ROUTE
router.get("/test", (req, res) => {
  res.send("Todo routes working");
});

// CREATE TODO (user-specific)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const todo = new Todo({
      title: req.body.title,
      user: req.user.userId
    });

    const savedTodo = await todo.save();
    await savedTodo.populate("user", "name");
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ TODOS (only logged-in user)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.userId }).populate("user", "name");
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TODOS (Admin: Get all todos with user name and email)
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    // Check the role from the token (req.user comes from authMiddleware)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const todos = await Todo.find({}).populate("user", "name email");
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE TODO (owner-only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    ).populate("user", "name");

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found or not authorized" });
    }

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE TODO (owner-only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTodo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found or not authorized" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
