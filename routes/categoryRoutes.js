const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  createCategory,
  getAllCategories,
  getCategoryTree,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Anyone can view categories.
router.get("/", getAllCategories);

// Anyone can view the category tree.
router.get("/tree", getCategoryTree);

// Only admins can create categories.
router.post("/", protect, authorize("admin"), createCategory);

// Only admins can update categories.
router.patch("/:id", protect, authorize("admin"), updateCategory);

// Only admins can delete categories.
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;