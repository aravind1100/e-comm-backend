import Cart from '../Models/cart.schema.js';
import Product from '../Models/product.schema.js';

// =========================
// Get User Cart
// =========================
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate('items.product', 'name price images');

    if (!cart) {
      // Create an empty cart if it doesn't exist
      const newCart = new Cart({ user: req.userId, items: [] });
      await newCart.save();
      return res.json(newCart);
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// Add Item to Cart
// =========================
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || product.stock < quantity) {
      return res.status(400).json({ message: "Product not available" });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product", "name price images");

    res.json({ items: cart.items });
  } catch (error) {
    console.log("Add to cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// Update Cart Item Quantity
// =========================
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product || product.stock < quantity) {
      return res.status(400).json({ message: 'Quantity exceeds available stock' });
    }

    cart.items[itemIndex].quantity = quantity;

    await cart.save();
    await cart.populate("items.product", "name price images");

    res.json({ items: cart.items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// Remove Item From Cart
// =========================
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();
    await cart.populate("items.product", "name price images");

    res.json({ items: cart.items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// Clear Cart
// =========================
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { $set: { items: [] } }
    );

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
