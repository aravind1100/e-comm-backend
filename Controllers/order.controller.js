import Order from "../Models/order.schema.js";


// Create new order
export const createOrder = async (req, res) => {
  try {
    const { items, shipping, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the order" });
    }

    if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city || !shipping.postalCode) {
      return res.status(400).json({ message: "Shipping information incomplete" });
    }

    // Use req.userId from your middleware
    const userId = req.userId;

    const newOrder = new Order({
      user: userId,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      shipping,
      totalAmount,
      status: "Pending",
      paymentStatus: shipping.paymentMethod === "cod" ? "Pending" : "Completed"
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error while creating order" });
  }
};

// Get all orders for a user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("items.id", "name price");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
};
