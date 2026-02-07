import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

const OrdersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const rollNumber = searchParams.get("rollNumber");

    if (!rollNumber) {
      Swal.fire(
        "Error",
        "Roll number is required to view orders",
        "error",
      ).then(() => {
        navigate("/");
      });
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("rollNumber", "==", rollNumber),
        );

        const querySnapshot = await getDocs(q);
        const ordersData = [];

        querySnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort pending first, then by queue position
        const sortedOrders = ordersData.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return b.queuePosition - a.queuePosition;
        });

        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        Swal.fire("Error", "Failed to fetch orders", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const intervalId = setInterval(fetchOrders, 5000); // Fetch every 5 seconds
    return () => clearInterval(intervalId);
  }, [location.search, navigate]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/")}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Your Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No orders found for this roll number</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order)}
              className={`bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition ${
                order.status === "pending" ? "border-l-4 border-yellow-500" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Order ID: {order.orderId}</h3>
                  <p className="text-gray-600">
                    {order.humanReadableDate} • {order.time}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold">₹{order.total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Order ID</p>
                  <p className="font-medium">{selectedOrder.orderId}</p>
                </div>

                <div>
                  <p className="text-gray-600">Bill ID</p>
                  <p className="font-medium">{selectedOrder.billId}</p>
                </div>

                <div>
                  <p className="text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {selectedOrder.humanReadableDate} • {selectedOrder.time}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Status</p>
                  <p
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedOrder.status,
                    )}`}
                  >
                    {selectedOrder.status}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">Items</h3>
                  <ul className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
