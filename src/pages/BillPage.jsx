import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const BillPage = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  // IDs
  const [billId, setBillId] = useState("");
  const [orderId, setOrderId] = useState("");

  // UI state
  const [showQR, setShowQR] = useState(false);
  const [upiUrl, setUpiUrl] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [finalCart, setFinalCart] = useState([]);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    setBillId(Math.random().toString(36).substring(7).toUpperCase());
    setOrderId(Math.random().toString(36).substring(7).toUpperCase());

    App.addListener("backButton", () => {
      navigate("/");
    });

    return () => App.removeAllListeners();
  }, []);

  const liveTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const displayCart = orderPlaced ? finalCart : cart;
  const displayTotal = orderPlaced ? finalTotal : liveTotal;

  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const generateTransactionId = () =>
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 8).toUpperCase();

  // ================= SAVE ORDER =================
  const saveOrderToFirestore = async (paymentMethod) => {
    const { value: rollNumber } = await Swal.fire({
      title: "Enter Your Roll Number",
      input: "text",
      inputPlaceholder: "e.g. 21BCE1234",
      showCancelButton: true,
      inputValidator: (v) => (!v ? "Roll number required!" : null),
    });

    if (!rollNumber) return false;

    // SNAPSHOT BEFORE CLEAR
    setFinalCart([...cart]);
    setFinalTotal(liveTotal);

    const orderData = {
      orderId,
      billId,
      items: cart,
      total: liveTotal.toFixed(2),
      date: serverTimestamp(),
      humanReadableDate: date,
      time,
      paymentMethod,
      status: paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      rollNumber,
      transactionId:
        paymentMethod !== "Cash on Delivery" ? generateTransactionId() : null,
      isCompleted: false,
      queuePosition: Date.now(),
    };

    await addDoc(collection(db, "orders"), orderData);

    clearCart();
    setOrderPlaced(true);

    return true;
  };

  // ================= PAYMENT =================
  const handlePayment = async () => {
    const result = await Swal.fire({
      title: "Choose Payment Method",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "QR Code",
      denyButtonText: "UPI App",
      cancelButtonText: "Cash on Delivery",
    });

    const upiLink = `upi://pay?pa=pinelabs.10032184@hdfcbank&am=${liveTotal.toFixed(
      2,
    )}&cu=INR`;

    setUpiUrl(upiLink);

    let method = "Cash on Delivery";

    if (result.isConfirmed) {
      method = "QR Code";
      setShowQR(true);
    } else if (result.isDenied) {
      method = "UPI App";
      window.location.href = upiLink;
    }

    const saved = await saveOrderToFirestore(method);

    if (saved) {
      Swal.fire("Order Placed!", "Please save your bill.", "success");
    }
  };

  // ================= UI =================
  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 mt-5">
      <h1 className="text-2xl font-bold text-center border-b pb-2">
        🍽️ CRM Foods
      </h1>

      <div className="mt-3 text-sm">
        <p>🧾 Bill ID: {billId}</p>
        <p>📦 Order ID: {orderId}</p>
        <p>📅 Date: {date}</p>
        <p>⏰ Time: {time}</p>
      </div>

      {/* ORDER SUMMARY */}
      <div className="mt-4">
        <h2 className="font-semibold border-b pb-1">🛒 Order Summary</h2>
        {displayCart.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="mt-4 flex justify-between font-bold border-t pt-2">
        <span>Total</span>
        <span>₹{displayTotal.toFixed(2)}</span>
      </div>

      {/* PAYMENT BUTTON */}
      {!orderPlaced && (
        <button
          onClick={handlePayment}
          className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4"
        >
          💳 Proceed to Payment
        </button>
      )}

      {/* RESPONSIVE QR */}
      {showQR && (
        <div className="mt-5 flex flex-col items-center bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Scan QR to Pay</h3>
          <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-white rounded-lg shadow">
            <QRCodeCanvas
              value={upiUrl}
              size={220}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">Works with all UPI apps</p>
        </div>
      )}

      {/* MANUAL HOME BUTTON */}
      {orderPlaced && (
        <button
          onClick={() => navigate("/")}
          className="w-full bg-green-600 text-white py-2 rounded-lg mt-5"
        >
          🏠 Go to Home
        </button>
      )}
    </div>
  );
};

export default BillPage;
