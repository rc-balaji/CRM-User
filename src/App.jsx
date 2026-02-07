import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage.jsx";
import CartPage from "./pages/CartPage.jsx";
import BillPage from "./pages/BillPage.jsx";
import { CartProvider } from "./context/CartContext.jsx";

import OrdersPage from "./pages/OrdersPage.jsx";
import "./App.css";

function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <CartProvider>
      <Router>
        {/* <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence> */}

        {!showSplash && (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/bill" element={<BillPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Routes>
        )}
      </Router>
    </CartProvider>
  );
}

export default App;
