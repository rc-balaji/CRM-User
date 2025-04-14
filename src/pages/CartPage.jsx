import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import Swal from "sweetalert2"; // Import SweetAlert2

const CartPage = () => {
  const { cart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    const backButtonHandler = () => {
      navigate(-1); // Go back to previous page instead of closing the app
    };

    App.addListener("backButton", backButtonHandler);

    return () => {
      App.removeAllListeners("backButton"); // Cleanup when component unmounts
    };
  }, [navigate]);

  const handleConfirmOrder = () => {
    Swal.fire({
      title: "Confirm Order?",
      text: "Are you sure you want to proceed with this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Confirm Order!",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/bill"); // Redirect to Bill Page if confirmed
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-gray-200 p-2 rounded-[5px] shadow-md hover:bg-gray-300 transition"
      >
        ⬅️ Back
      </button>

      <h2 className="text-2xl font-bold mb-4 text-center">🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      ) : (
        cart.map((item) => (
          <div
            key={item.uniqueId}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-3"
          >
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-gray-600 text-sm">₹{item.price} per item</p>
              </div>
            </div>

            <div className="flex gap-[20px] items-center">
              <p className="text-lg font-bold text-gray-700">
                ₹{item.price * item.quantity}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.uniqueId, -1)}
                  className="px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  -
                </button>
                <span className="text-lg font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.uniqueId, 1)}
                  className="px-3 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold">Total Amount:</h3>
        <p className="text-2xl font-bold text-green-600">₹{total}</p>
      </div>

      {cart.length > 0 && (
        <button
          onClick={handleConfirmOrder} // Confirm before generating bill
          className="w-full bg-blue-600 text-white text-lg py-3 mt-6 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          🧾 Generate Bill
        </button>
      )}
    </div>
  );
};

export default CartPage;
