import Product from '../Models/product.schema.js';
import Category from '../Models/category.schema.js';

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images, featured } = req.body;
    
    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      images,
      featured: featured || false
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products 

export const getProducts = async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    const query = { isDeleted: false };

    // Filter by category slug
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }

    // Filter by featured products
    if (featured) query.featured = featured === "true";

    // Search by name (case-insensitive)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Fetch products
    const products = await Product.find(query).populate("category", "name slug");

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product || product.isDeleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, images, featured } = req.body;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, stock, images, featured },
      { new: true }
    );
    
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};