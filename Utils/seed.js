import connectDB from "../Database/db.config.js";
import Category from "../Models/category.schema.js";
import Product from "../Models/product.schema.js";
import { categories } from "./categories.js";
import { products } from "./products.js";

connectDB() // ensures DB is connected when running this seed file

const importData = async () => {
  try {
    // Clear existing data if needed
    await Category.deleteMany();
    await Product.deleteMany();

    // Insert categories
    const createdCategories = await Category.insertMany(categories);

    // Map category slugs to their _id
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Replace category slug in products with actual _id
    const productsWithCategoryIds = products.map(prod => ({
      ...prod,
      category: categoryMap[prod.category],
    }));

    // Insert products
    await Product.insertMany(productsWithCategoryIds);

    console.log("Data imported successfully!");
    process.exit();
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
};

importData();
