import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { ShoppingCart, ChevronDown, ChevronUp, History } from "lucide-react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";

const HomePage = () => {
  const { cart, addToCart } = useCart();
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch available items from Firebase
  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "availableItems"));
        const itemsByCategory = {};

        querySnapshot.forEach((doc) => {
          const item = doc.data();
          if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
          }
          itemsByCategory[item.category].push({
            id: doc.id,
            ...item,
          });
        });

        // Initialize openCategory state
        const initialOpenState = {};
        Object.keys(itemsByCategory).forEach((category) => {
          initialOpenState[category] = true;
        });

        setCategories(itemsByCategory);
        setOpenCategory(initialOpenState);
      } catch (error) {
        console.error("Error fetching items: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableItems();
  }, []);

  const handleViewOrders = async () => {
    const { value: rollNumber } = await Swal.fire({
      title: "Enter Your Roll Number",
      input: "text",
      inputPlaceholder: "e.g. 21BCE1234",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter your roll number!";
        }
      },
    });

    if (rollNumber) {
      navigate(`/orders?rollNumber=${rollNumber}`);
    }
  };

  // Update category visibility based on search
  useEffect(() => {
    if (Object.keys(categories).length > 0) {
      const updatedCategoryState = {};
      Object.entries(categories).forEach(([category, items]) => {
        updatedCategoryState[category] = items.some((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      });
      setOpenCategory(updatedCategoryState);
    }
  }, [search, categories]);

  const toggleCategory = (category) => {
    setOpenCategory((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center fixed bg-white w-full p-4 shadow-md z-10">
        <h1 className="text-2xl font-bold">🍽️ Menu</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleViewOrders}
            className="p-2 rounded-full hover:bg-gray-100"
            title="View Orders"
          >
            <History className="w-6 h-6 text-gray-700" />
          </button>
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-8 h-8 text-gray-700" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <br />
        <br />
        <br />

        {/* Search Bar */}
        <input
          type="text"
          placeholder="🔍 Search food..."
          className="border p-3 w-full rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />

        {/* Food Categories */}
        <div className="space-y-4">
          {Object.entries(categories).map(([category, items]) => {
            const filteredItems = items.filter((item) =>
              item.name.toLowerCase().includes(search.toLowerCase())
            );

            return filteredItems.length > 0 ? (
              <div key={category} className="bg-white rounded-lg shadow-md">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex justify-between items-center px-4 py-3 font-bold text-lg text-gray-700 border-b"
                >
                  <span className="flex items-center">
                    {getCategoryIcon(category)} {formatCategoryName(category)}
                  </span>
                  {openCategory[category] ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>

                {/* Food Items */}
                {openCategory[category] && (
                  <ul className="divide-y divide-gray-200 p-4">
                    {filteredItems.map((item) => {
                      const uniqueId = `${item.id}-${category}`;
                      const isAdded = cart.some(
                        (cartItem) => cartItem.uniqueId === uniqueId
                      );
                      const isOutOfStock = item.quantity <= 0;

                      return (
                        <li
                          key={uniqueId}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/150";
                              }}
                            />
                            <div>
                              <h3 className="text-lg font-semibold">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-3">
                                <p className="text-gray-600">₹{item.price}</p>
                                {isOutOfStock && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                    Out of stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() =>
                              !isAdded &&
                              !isOutOfStock &&
                              addToCart({ ...item, category, uniqueId })
                            }
                            disabled={isAdded || isOutOfStock}
                            className={`text-white px-4 py-2 rounded-md transition ${
                              isAdded
                                ? "bg-gray-400 cursor-not-allowed"
                                : isOutOfStock
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {isAdded
                              ? "Added ✅"
                              : isOutOfStock
                              ? "Unavailable"
                              : "Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getCategoryIcon = (category) => {
  const icons = {
    morning_food: "🍳",
    lunch: "🍲",
    snacks: "🍕",
    chocolate: "🍫",
    drink: "🥤",
  };
  return icons[category] || "🍽️";
};

const formatCategoryName = (category) => {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default HomePage;
