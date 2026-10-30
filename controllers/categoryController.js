const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const Product = require("../models/Product");

// Create a new category
const createCategory =  async(req,res,next)=>{
    try{
       
        const {name,description,parent} = req.body;

        if(!name || typeof name !== "string"){
            throw new AppError("Category name is required", 400);
        }
        // Check whether the parent category exists.
        if(parent){
            const parentCategory = await Category.findById(parent);

            if(!parentCategory){
                throw new AppError("Parent category not found", 404);
            }
        }
        const slug = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        
        const category = await Category.create({
            name: name.trim(),
            description,
            parent: parent || null,
            slug,
        });
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};
// Get all categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name slug")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// Get complete category tree
const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();

    const categoryMap = {};

    // Create a map of all categories.
    categories.forEach((category) => {
      category.children = [];
      categoryMap[category._id.toString()] = category;
    });

    const tree = [];

    // Connect child categories to their parents.
    categories.forEach((category) => {
      if (category.parent) {
        const parent = categoryMap[category.parent.toString()];

        if (parent) {
          parent.children.push(category);
        }
      } else {
        tree.push(category);
      }
    });

    res.status(200).json({
      success: true,
      results: tree.length,
      data: { categories: tree },
    });
  } catch (error) {
    next(error);
  }
};

//check circular realationship

const checkCircularParent = async (categoryId, newParentId) => {
  let currentParentId = newParentId;
  const visited = new Set();

  while (currentParentId) {
    const currentId = currentParentId.toString();

    if (currentId === categoryId.toString()) {
      return true;
    }

    if (visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    const parentCategory = await Category.findById(currentId)
      .select("parent")
      .lean();

    if (!parentCategory) {
      return true;
    }

    currentParentId = parentCategory.parent;
  }

  return false;
};


//update a category
const updateCategory = async (req,res,next)=>{
    try{
        const {name,description,parent,isActive}= req.body;

        const category = await Category.findById(req.params.id);
        if(!category){
            throw new AppError("Categor not found",404);
        }
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                throw new AppError("Category name cannot be empty", 400);
      }
      category.name = name.trim();
      
      category.slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (description !== undefined) {
      category.description = description;
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    if (parent !== undefined) {
      if (parent === null || parent === "") {
        category.parent = null;
      } else {
        if (parent === category._id.toString()) {
          throw new AppError("A category cannot be its own parent", 400);
        }

        const parentCategory = await Category.findById(parent);

        if (!parentCategory) {
          throw new AppError("Parent category not found", 404);
        }
        const createsCycle = await checkCircularParent(category._id,parent);
        if (createsCycle) {
            throw new AppError("Cannot create a circular category relationship",400);
        }
        category.parent = parent;
      }
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};
//delete category

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    // Check whether this category has child categories.
    const hasChildren = await Category.exists({
      parent: category._id,
    });

    if (hasChildren) {
      throw new AppError(
        "Cannot delete a category that has child categories",
        400
      );
    }
    const hasProducts = await Product.exists({
  category: category._id,
});

if (hasProducts) {
  throw new AppError(
    "Cannot delete a category that contains products",
    400);
  }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCategory ,getAllCategories,getCategoryTree,updateCategory,deleteCategory};