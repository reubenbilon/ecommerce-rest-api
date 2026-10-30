
const Product = require("../models/Product");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

// CREATE PRODUCT (Admin only)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      salePrice,
      stock,
      category,
      status,
    } = req.body;

    if (!name || !sku || price === undefined || stock === undefined || !category) {
      throw new AppError(
        "Name, SKU, price, stock and category are required",
        400
      );
    }

    if (
      !Number.isFinite(price) ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      price < 0
    ) {
      throw new AppError("Invalid price or stock value", 400);
    }

    if (
      salePrice !== undefined &&
      salePrice !== null &&
      (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)
    ) {
      throw new AppError("Sale price must be between zero and regular price", 400);
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      throw new AppError("Category not found", 404);
    }

    const product = await Product.create({
      name,
      sku,
      description,
      price,
      salePrice,
      stock,
      category,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PRODUCTS (Search, filter, sort, pagination)
const getAllProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      throw new AppError(
        "Page must be a positive integer and limit must be between 1 and 100",400);
      }
      const filter = { status: "active" };

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }

      if (
        Object.values(filter.price).some(
          (value) => !Number.isFinite(value) || value < 0
        )
      ) {
        throw new AppError("Invalid price filter", 400);
      }
    }

    // Include products in the selected category and all descendants.
    if (category) {
  if (!mongoose.isValidObjectId(category)) {
    throw new AppError("Invalid category ID", 400);
  }

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    throw new AppError("Category not found", 404);
  }

      const categories = await Category.find().select("_id parent").lean();
      const categoryIds = new Set([category]);

      let changed = true;

      while (changed) {
        changed = false;

        for (const item of categories) {
          if (
            item.parent &&
            categoryIds.has(item.parent.toString()) &&
            !categoryIds.has(item._id.toString())
          ) {
            categoryIds.add(item._id.toString());
            changed = true;
          }
        }
      }

      filter.category = {
        $in: [...categoryIds],
      };
    }

    const allowedSortFields = ["price", "name", "createdAt", "stock"];

    if (!allowedSortFields.includes(sort)) {
      throw new AppError("Invalid sort field", 400);
    }

    if (!["asc", "desc"].includes(order)) {
      throw new AppError("Order must be asc or desc", 400);
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limitNumber),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: products.length,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug");

    if (!product || product.status !== "active") {
      throw new AppError("Product not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT (Admin only)
const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "price",
      "salePrice",
      "stock",
      "category",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.price !== undefined &&
        (!Number.isFinite(updates.price) || updates.price < 0)) {
      throw new AppError("Invalid price", 400);
    }

    if (updates.stock !== undefined &&
        (!Number.isInteger(updates.stock) || updates.stock < 0)) {
      throw new AppError("Invalid stock", 400);
    }

    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);

      if (!categoryExists) {
        throw new AppError("Category not found", 404);
      }
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    Object.assign(product, updates);

    if (
      product.salePrice !== null &&
      product.salePrice !== undefined &&
      product.salePrice > product.price
    ) {
      throw new AppError("Sale price cannot exceed regular price", 400);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE PRODUCT (Admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
