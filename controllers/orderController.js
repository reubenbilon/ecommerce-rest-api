const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// CREATE ORDER - Customer
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("Please provide at least one product", 400);
    }

    // Combine duplicate product IDs and validate quantities.
    const quantities = new Map();

    for (const item of items) {
      if (
        !mongoose.isValidObjectId(item.product) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        throw new AppError("Invalid product ID or quantity", 400);
      }

      const id = item.product.toString();
      quantities.set(id, (quantities.get(id) || 0) + item.quantity);
    }

    let order;

    await session.withTransaction(async () => {
      const orderItems = [];
      let totalAmount = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findOne({
          _id: productId,
          status: "active",
        }).session(session);

        if (!product) {
          throw new AppError(`Product ${productId} not found or inactive`, 404);
        }

        if (product.stock < quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }

        const price = product.salePrice ?? product.price;
        const subtotal = price * quantity;

        // Reduce stock only if enough stock is still available.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            status: "active",
            stock: { $gte: quantity },
          },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );

        if (!updatedProduct) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity,
          price,
          subtotal,
        });

        totalAmount += subtotal;
      }

      [order] = await Order.create(
        [
          {
            customer: req.user._id,
            items: orderItems,
            totalAmount,
          },
        ],
        { session }
      );
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// GET ORDERS - Customer sees own orders, Admin sees all.
exports.getOrders = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { customer: req.user._id };

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// GET ONE ORDER
exports.getOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError("Invalid order ID", 400);
    }

    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, customer: req.user._id };

    const order = await Order.findOne(filter)
      .populate("customer", "name email")
      .populate("items.product", "name sku");

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE ORDER STATUS - Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    if (!Object.prototype.hasOwnProperty.call(allowedTransitions, status)) {
      throw new AppError("Invalid order status", 400);
    }

    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        order = await Order.findById(req.params.id).session(session);

        if (!order) {
          throw new AppError("Order not found", 404);
        }

        if (!allowedTransitions[order.status].includes(status)) {
          throw new AppError(
            `Cannot change order from ${order.status} to ${status}`,
            400
          );
        }

        // Restore stock if the order is cancelled.
        if (status === "Cancelled") {
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        }

        order.status = status;
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};