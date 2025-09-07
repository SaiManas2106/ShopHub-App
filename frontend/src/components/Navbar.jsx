import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username"); // ✅ fixed key
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(storedCart.length);
  }, []);

  return (
    <header className="header">
      <div className="left">
        <Link to="/" className="logo">
          <div className="mark">🛍️</div>
          <div>
            <div className="title">ShopHub</div>
            <div className="tag">Style. Tech. Home. Life.</div>
          </div>
        </Link>
      </div>

      <nav>
        <Link to="/">Products</Link>

        <Link to="/cart" style={{ position: "relative" }}>
          🛒 Cart
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-10px",
                background: "red",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        {token ? (
          <>
            <span style={{ marginLeft: "12px", fontWeight: "500" }}>
              Hi, {username || "User"}
            </span>
            <button
              className="linkish"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </nav>
    </header>
  );
}
