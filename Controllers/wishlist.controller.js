import Wishlist from '../Models/wishlist.schema.js';

// Get wishlist
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId })
      .populate("products", "name price images");

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, products: [] });
      await wishlist.save();
    }

    res.json({ products: wishlist.products });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.userId,
        products: [productId],
      });
      await wishlist.save();
      await wishlist.populate("products", "name price images");
      return res.status(201).json({ products: wishlist.products });
    }

    // Prevent duplicates
    if (wishlist.products.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.products.push(productId);
    await wishlist.save();
    await wishlist.populate("products", "name price images");

    res.json({ products: wishlist.products });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (product) => product.toString() !== req.params.productId
    );

    await wishlist.save();
    await wishlist.populate("products", "name price images");

    res.json({ products: wishlist.products });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
