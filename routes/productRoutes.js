
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin routes
router.post("/", protect, authorize("admin"), createProduct);
router.patch("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
