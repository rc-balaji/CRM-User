import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { QRCodeCanvas } from "qrcode.react"; // Ensure correct import
import Swal from "sweetalert2";

const BillPage = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const [billId, setBillId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [upiUrl, setUpiUrl] = useState("");

  useEffect(() => {
    setBillId(Math.random().toString(36).substring(7).toUpperCase());
    setOrderId(Math.random().toString(36).substring(7).toUpperCase());

    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        navigate("/");
      } else {
        App.exitApp();
      }
    });

    return () => {
      App.removeAllListeners();
    };
  }, []);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const generateTransactionId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${randomId}`;
  };

  const handlePayment = () => {
    Swal.fire({
      title: "Choose Payment Method",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "QR Code",
      denyButtonText: "UPI App",
      cancelButtonText: "Cash on Delivery",
    }).then((result) => {
      const transactionId = generateTransactionId();
      const upiLink = `upi://pay?pa=pinelabs.10032184@hdfcbank&tr=${transactionId}&am=${total.toFixed(
        2
      )}&cu=INR`;
      setUpiUrl(upiLink);

      if (result.isConfirmed) {
        setShowQR(true);
      } else if (result.isDenied) {
        window.location.href = upiLink;
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire("Order Placed!", "Thank you for your purchase!", "success");
      }
    });
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Are you sure you want to cancel the order?",
      text: "This action will cancel the entire order and you will be redirected to the home page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No, Go Back",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/"); // Redirect to the home page
      }
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 mt-5 relative">
      <button
        onClick={() => navigate("/")} // This will navigate to the home page
        className="absolute top-4 right-4 bg-gray-200 p-2 rounded-md shadow-md hover:bg-gray-300"
      >
        🏠 Home
      </button>
      <h1 className="text-2xl font-bold text-center border-b pb-2">
        🍽️ CRM Foods
      </h1>
      <div className="mt-3">
        <p>
          🧾 <strong>Bill ID:</strong> {billId}
        </p>
        <p>
          📦 <strong>Order ID:</strong> {orderId}
        </p>
        <p>
          📅 <strong>Date:</strong> {date}
        </p>
        <p>
          ⏰ <strong>Time:</strong> {time}
        </p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🛒 Order Summary
        </h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 mt-2">No items in cart.</p>
        ) : (
          <ul className="mt-2">
            {cart.map((item) => (
              <li
                key={item.uniqueId}
                className="flex justify-between text-gray-700 py-2 border-b"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex justify-between text-xl font-bold border-t pt-2">
        <span>Total:</span>
        <span>₹{total.toFixed(2)}</span>
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handlePayment}
          className="w-full bg-blue-500 text-white py-2 rounded-lg text-lg font-semibold"
        >
          💳 Proceed to Payment
        </button>
      </div>

      {showQR && (
        <div className="mt-6 text-center bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Scan QR to Pay</h3>
          <QRCodeCanvas
            value={upiUrl}
            size={200}
            includeMargin={true}
            className="mx-auto shadow-lg p-2 bg-white rounded-lg"
          />
          <p className="mt-2 text-gray-600">Scan with any UPI app</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleCancel}
          className="w-full bg-red-500 text-white py-2 rounded-lg text-lg font-semibold"
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
};

export default BillPage;
