const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

router.use(protect);

router.post("/", authorize("customer"), createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", authorize("admin"), updateOrderStatus);

module.exports = router;