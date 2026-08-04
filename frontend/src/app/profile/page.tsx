"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { apiRequest } from "@/lib/api";
import { Heart, ShoppingBag, User, LogOut, CheckCircle, Package } from "lucide-react";
import { ProductReviewSummary } from "@/components/ProductReviewSummary";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, logout, updateUser } = useCustomerAuth();
  const { favoritesList, isFavorite, toggleFavorite, loading: favsLoading } = useFavorites();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "favorites">("profile");

  // Profile update form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "favorites") {
      setActiveTab("favorites");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoaded && !user) {
      showToast("Please login to view your profile", "warning");
      router.push("/login");
    } else if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user, isLoaded, router, showToast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast("Name and email are required", "error");
      return;
    }

    try {
      setSavingProfile(true);
      await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email, phone })
      });

      // Update local stored session user and context state
      updateUser({ name, email, phone });

      showToast("Profile updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "36px", color: "#2d5016" }}></i>
          <p style={{ marginTop: "15px", color: "#666" }}>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Breadcrumb Header */}
      <section
        className="breadcumb-wrapper"
        style={{
          backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "60px 0"
        }}
      >
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title" style={{ color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
              My Account
            </h1>
            <div className="breadcumb-menu-wrap">
              <ul className="breadcumb-menu" style={{ color: "rgba(255,255,255,0.9)" }}>
                <li><Link href="/">Home</Link></li>
                <li>Customer Profile</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: "50px 0", background: "#f9fcf8" }}>
        <div className="container">
          <div className="row g-4">
            
            {/* Sidebar Navigation */}
            <div className="col-lg-3">
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 10px 30px rgba(45, 80, 22, 0.08)",
                  border: "1px solid rgba(45, 80, 22, 0.1)",
                  position: "sticky",
                  top: "120px",
                  zIndex: 10
                }}
              >
                {/* User Avatar & Info */}
                <div style={{ textAlign: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2d5016 0%, #4a7c29 100%)",
                      color: "#ffffff",
                      fontSize: "32px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 15px",
                      boxShadow: "0 6px 16px rgba(45, 80, 22, 0.25)"
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2d5016", margin: "0 0 4px" }}>
                    {user.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>{user.email}</p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "4px 12px",
                      background: "#eaf4e5",
                      color: "#2d5016",
                      fontSize: "12px",
                      fontWeight: "600",
                      borderRadius: "20px"
                    }}
                  >
                    Customer Account
                  </span>
                </div>

                {/* Sidebar Navigation Menu */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "none",
                      background: activeTab === "profile" ? "#2d5016" : "transparent",
                      color: activeTab === "profile" ? "#ffffff" : "#444444",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left"
                    }}
                  >
                    <User size={18} />
                    Profile Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("favorites")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "none",
                      background: activeTab === "favorites" ? "#2d5016" : "transparent",
                      color: activeTab === "favorites" ? "#ffffff" : "#444444",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Heart size={18} />
                      My Favourites
                    </div>
                    {favoritesList.length > 0 && (
                      <span
                        style={{
                          background: activeTab === "favorites" ? "#ffffff" : "#2d5016",
                          color: activeTab === "favorites" ? "#2d5016" : "#ffffff",
                          fontSize: "12px",
                          fontWeight: "700",
                          borderRadius: "20px",
                          padding: "2px 8px"
                        }}
                      >
                        {favoritesList.length}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/my-orders"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      color: "#444444",
                      fontWeight: "600",
                      fontSize: "15px",
                      textDecoration: "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <Package size={18} />
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "none",
                      background: "#fff1f1",
                      color: "#dc3545",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      marginTop: "15px",
                      transition: "all 0.2s ease",
                      textAlign: "left"
                    }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="col-lg-9">
              {activeTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                  {/* Profile Edit Form */}
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      padding: "30px",
                      boxShadow: "0 10px 30px rgba(45, 80, 22, 0.08)",
                      border: "1px solid rgba(45, 80, 22, 0.1)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                      <User size={22} color="#2d5016" />
                      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#2d5016", margin: 0 }}>
                        Personal Information
                      </h2>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "8px", display: "block" }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              border: "1px solid #ccc",
                              fontSize: "15px",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "8px", display: "block" }}>
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              border: "1px solid #ccc",
                              fontSize: "15px",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "8px", display: "block" }}>
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter 10-digit mobile number"
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              border: "1px solid #ccc",
                              fontSize: "15px",
                              outline: "none"
                            }}
                          />
                        </div>

                        {/* Save Changes button removed as per request */}
                        {/* 
                        <div className="col-12" style={{ marginTop: "20px" }}>
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="vs-btn"
                            style={{ padding: "12px 30px", borderRadius: "10px", fontSize: "15px" }}
                          >
                            {savingProfile ? (
                              <>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                        */}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Favourites Tab */}
              {activeTab === "favorites" && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "30px",
                    boxShadow: "0 10px 30px rgba(45, 80, 22, 0.08)",
                    border: "1px solid rgba(45, 80, 22, 0.1)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "25px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Heart size={24} color="#dc2626" fill="#dc2626" />
                      <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2d5016", margin: 0 }}>
                        My Favourite Plants &amp; Seeds
                      </h2>
                    </div>
                    <span style={{ fontSize: "14px", color: "#666", fontWeight: "600" }}>
                      {favoritesList.length} Saved Item{favoritesList.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {favsLoading ? (
                    <div style={{ textAlign: "center", padding: "50px 20px" }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: "32px", color: "#2d5016" }}></i>
                      <p style={{ color: "#666", marginTop: "10px" }}>Loading your favourites...</p>
                    </div>
                  ) : favoritesList.length > 0 ? (
                    <div className="row g-4">
                      {favoritesList.map((product) => (
                        <div className="col-6 col-md-6 col-lg-6" key={product.id}>
                          <div className="vs-product product-style1 modern-card">
                            <div className="product-img">
                              <button
                                type="button"
                                className="card-favorite-btn"
                                aria-label={isFavorite(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                                onClick={(e) => toggleFavorite(product, e)}
                              >
                                <i className={isFavorite(product.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: isFavorite(product.id) ? "#dc2626" : "#666666" }}></i>
                              </button>
                              <Link href={`/products/${product.id}`}>
                                <img src={product.image} alt={product.name} className="img w-100" />
                              </Link>
                              {product.stock <= 0 && <span className="product-tag2" style={{ background: "var(--danger)" }}>Out of Stock</span>}
                              {product.stock > 0 && product.stock < 100 && <span className="product-tag2" style={{ background: "#d4a516" }}>Limited Stock</span>}
                            </div>
                            <div className="product-content">
                              <ProductReviewSummary productId={product.id} rating={product.average_rating} totalReviews={product.total_reviews} />
                              <h3 className="product-title" style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "6px"
                              }}>
                                <Link href={`/products/${product.id}`}>{product.name}</Link>
                              </h3>
                              <p style={{
                                fontSize: "13px",
                                color: "#777777",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "12px",
                                lineHeight: "1.4"
                              }}>
                                {product.description || "No description available."}
                              </p>
                              <span className="product-cate" style={{ margin: 0, fontSize: "11px", fontWeight: 700, marginBottom: "8px", display: "block" }}>
                                SUBCATEGORY: <span style={{ fontWeight: 500, color: "var(--title-color)" }}>{product.category}</span>
                              </span>
                              <span className="product-price">Rs. {product.price}</span>
                              <div className="product-actions">
                                <button type="button" className="vs-btn" onClick={() => addToCart(product, 1)}>
                                  Add to Cart
                                </button>
                                <button type="button" className="cart-btn" onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}>
                                  <i className="fas fa-shopping-basket"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "#fff1f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 20px"
                        }}
                      >
                        <Heart size={40} color="#dc2626" />
                      </div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#2d5016", marginBottom: "10px" }}>
                        No Favourite Items Yet
                      </h3>
                      <p style={{ color: "#666", maxWidth: "450px", margin: "0 auto 25px", lineHeight: "1.6" }}>
                        You haven&apos;t saved any plants or seeds to your favourites yet. Click the heart icon on any product to save it here!
                      </p>
                      <Link href="/products" className="vs-btn" style={{ padding: "12px 30px", borderRadius: "10px" }}>
                        Explore Products
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "36px", color: "#2d5016" }}></i>
          <p style={{ marginTop: "15px", color: "#666" }}>Loading profile...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
