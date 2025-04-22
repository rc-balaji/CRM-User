import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import Swal from "sweetalert2";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const CartPage = () => {
  const { cart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [availableQuantities, setAvailableQuantities] = useState({});
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const fetchQuantities = async () => {
    const quantities = {};
    for (const item of cart) {
      const docRef = doc(db, "availableItems", item.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        quantities[item.id] = docSnap.data().quantity;
      } else {
        quantities[item.id] = 0;
      }
    }
    setAvailableQuantities(quantities);
  };

  // Fetch available quantities from Firestore
  useEffect(() => {
    if (cart.length > 0) {
      fetchQuantities();
    }
  }, [cart]);

  useEffect(() => {
    const backButtonHandler = () => {
      navigate(-1);
    };

    App.addListener("backButton", backButtonHandler);

    return () => {
      App.removeAllListeners("backButton");
    };
  }, [navigate]);

  const handleConfirmOrder = async () => {
    setLoading(true);

    try {
      // First check all items for availability
      const availabilityCheck = await Promise.all(
        cart.map(async (item) => {
          const docRef = doc(db, "availableItems", item.id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            return { id: item.id, available: 0, name: item.name };
          }

          const availableQty = docSnap.data().quantity;
          return { id: item.id, available: availableQty, name: item.name };
        })
      );

      // Find items that don't have enough quantity
      const outOfStockItems = availabilityCheck.filter(
        (item) => item.available < cart.find((i) => i.id === item.id).quantity
      );

      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map((item) => item.name).join(", ");
        const message =
          outOfStockItems.length === 1
            ? `${itemNames} doesn't have enough quantity available. Please adjust your order.`
            : `These items don't have enough quantity available: ${itemNames}. Please adjust your order.`;

        await Swal.fire({
          title: "Out of Stock",
          text: message,
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
        setLoading(false);
        fetchQuantities();
        return;
      }

      // Confirm order with user
      const result = await Swal.fire({
        title: "Confirm Order?",
        html: `
          <div>Total Items: ${cart.reduce(
            (sum, item) => sum + item.quantity,
            0
          )}</div>
          <div>Total Amount: ₹${total}</div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Confirm Order!",
      });

      if (result.isConfirmed) {
        // Update quantities in Firestore
        const updatePromises = cart.map(async (item) => {
          const docRef = doc(db, "availableItems", item.id);
          const currentData = (await getDoc(docRef)).data();
          await updateDoc(docRef, {
            quantity: currentData.quantity - item.quantity,
          });
        });

        await Promise.all(updatePromises);

        navigate("/bill", { state: { cart, total } });
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      await Swal.fire({
        title: "Error",
        text: "Failed to process your order. Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-gray-200 p-2 rounded-[5px] shadow-md hover:bg-gray-300 transition"
        disabled={loading}
      >
        ⬅️ Back
      </button>

      <h2 className="text-2xl font-bold mb-4 text-center">🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      ) : (
        cart.map((item) => {
          const available = availableQuantities[item.id] || 0;
          const isLowStock = available < item.quantity;
          const isOutOfStock = available === 0;

          return (
            <div
              key={item.uniqueId}
              className={`flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-3 ${
                isOutOfStock ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm">
                    ₹{item.price} per item
                  </p>
                  {available !== undefined && (
                    <p
                      className={`text-xs ${
                        isOutOfStock
                          ? "text-red-600"
                          : isLowStock
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      Available: {available}
                      {isLowStock && " (Not enough)"}
                      {isOutOfStock && " (Out of stock)"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-[20px] items-center">
                <p className="text-lg font-bold text-gray-700">
                  ₹{item.price * item.quantity}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.uniqueId, -1)}
                    className="px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-50"
                    disabled={item.quantity <= 0 || loading}
                  >
                    -
                  </button>
                  <span className="text-lg font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.uniqueId, 1)}
                    className="px-3 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition disabled:opacity-50"
                    disabled={
                      isOutOfStock ||
                      loading ||
                      (available !== undefined && item.quantity >= available)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold">Total Amount:</h3>
        <p className="text-2xl font-bold text-green-600">₹{total}</p>
      </div>

      {cart.length > 0 && (
        <button
          onClick={handleConfirmOrder}
          disabled={
            loading || cart.some((item) => availableQuantities[item.id] === 0)
          }
          className={`w-full bg-blue-600 text-white text-lg py-3 mt-6 rounded-lg shadow-md hover:bg-blue-700 transition ${
            loading ? "opacity-70" : ""
          }`}
        >
          {loading ? "Processing..." : "🧾 Generate Bill"}
        </button>
      )}
    </div>
  );
};

export default CartPage;
