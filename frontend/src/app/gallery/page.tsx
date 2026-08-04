"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, getMediaUrl } from "@/lib/api";
import { Image as ImageIcon, Video as VideoIcon, Play, X, Eye, Film, Sparkles } from "lucide-react";

function GalleryContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "all";

  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      let query = "/api/gallery?public=true";
      if (activeTab === "image" || activeTab === "video") {
        query += `&mediaType=${activeTab}`;
      }
      const data = await apiRequest<any[]>(query);
      setGalleryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load gallery items:", err);
      setGalleryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [activeTab]);

  const imagesCount = galleryItems.filter((item) => item.media_type === "image").length;
  const videosCount = galleryItems.filter((item) => item.media_type === "video").length;

  const renderMediaPreview = (item: any) => {
    const isVideo = item.media_type === "video";
    const mediaUrl = getMediaUrl(item.media_url);

    if (!isVideo) {
      return (
        <img
          src={mediaUrl}
          alt={item.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    if (item.thumbnail_url && item.thumbnail_url !== item.media_url) {
      return (
        <img
          src={getMediaUrl(item.thumbnail_url)}
          alt={item.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
        />
      );
    }

    const ytMatch = item.media_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return (
        <img
          src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`}
          alt={item.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
        />
      );
    }

    return (
      <video
        src={mediaUrl}
        preload="metadata"
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
      />
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Media Gallery</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>Gallery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* breadcumb End */}

      <main style={{ flex: 1, padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "36px",
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              border: "1px solid",
              borderColor: activeTab === "all" ? "#2f6b3f" : "#cbd5e1",
              background: activeTab === "all" ? "#2f6b3f" : "white",
              color: activeTab === "all" ? "white" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s"
            }}
          >
            All Gallery
          </button>

          <button
            onClick={() => setActiveTab("image")}
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              border: "1px solid",
              borderColor: activeTab === "image" ? "#2f6b3f" : "#cbd5e1",
              background: activeTab === "image" ? "#2f6b3f" : "white",
              color: activeTab === "image" ? "white" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <ImageIcon size={17} />
            Image Gallery
          </button>

          <button
            onClick={() => setActiveTab("video")}
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              border: "1px solid",
              borderColor: activeTab === "video" ? "#2f6b3f" : "#cbd5e1",
              background: activeTab === "video" ? "#2f6b3f" : "white",
              color: activeTab === "video" ? "white" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <VideoIcon size={17} />
            Video Gallery
          </button>
        </div>

        {/* Media Grid - Asymmetric Mosaic Layout */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--muted)", fontSize: "16px" }}>
            Loading media gallery...
          </div>
        ) : galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <ImageIcon size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", margin: "0 0 8px 0", color: "var(--text)" }}>No media found</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>Check back soon for new photo and video updates!</p>
          </div>
        ) : (
          <>
            <style jsx global>{`
              @keyframes galleryFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(20px) scale(0.96);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              .gallery-tile {
                animation: galleryFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                opacity: 0;
              }

              .gallery-center-icon {
                opacity: 0;
                transform: scale(0.7);
                transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              }

              .gallery-tile:hover .gallery-center-icon {
                opacity: 1;
                transform: scale(1);
              }

              .gallery-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-auto-rows: 240px;
                gap: 20px;
              }

              @media (max-width: 990px) {
                .gallery-grid {
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                }
              }

              @media (max-width: 640px) {
                .gallery-grid {
                  grid-template-columns: 1fr;
                }
                .gallery-tile-tall {
                  grid-row: span 1 !important;
                  height: 250px !important;
                }
              }
            `}</style>

            <div className="gallery-grid">
              {galleryItems.map((item, index) => {
                const isVideo = item.media_type === "video";
                const mod15 = index % 15;
                const isTall = mod15 === 0 || mod15 === 7 || mod15 === 11;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className={`gallery-tile ${isTall ? "gallery-tile-tall" : ""}`}
                    style={{
                      gridRow: isTall ? "span 2" : "span 1",
                      position: "relative",
                      height: "100%",
                      borderRadius: "16px",
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "#0f172a",
                      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.07)",
                      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      animationDelay: `${(index % 8) * 0.05}s`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                      e.currentTarget.style.boxShadow = "0 20px 30px -10px rgba(0, 0, 0, 0.35)";
                      const img = e.currentTarget.querySelector(".gallery-media-element") as HTMLElement;
                      if (img) img.style.transform = "scale(1.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                      const img = e.currentTarget.querySelector(".gallery-media-element") as HTMLElement;
                      if (img) img.style.transform = "scale(1)";
                    }}
                  >
                    {/* Full Media Preview Background */}
                    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                      <div className="gallery-media-element" style={{ width: "100%", height: "100%", transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        {renderMediaPreview(item)}
                      </div>
                    </div>

                    {/* Dark Gradient Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.45) 50%, rgba(15, 23, 42, 0.05) 100%)",
                        pointerEvents: "none"
                      }}
                    />

                    {/* Top Badges */}
                    <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2, pointerEvents: "none" }}>
                      <span
                        style={{
                          background: isVideo ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                          color: "white",
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                        }}
                      >
                        {isVideo ? "Video" : "Photo"}
                      </span>

                      {item.category && (
                        <span
                          style={{
                            background: "rgba(255, 255, 255, 0.22)",
                            backdropFilter: "blur(8px)",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.3px",
                            border: "1px solid rgba(255, 255, 255, 0.25)"
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Center Floating Icon (Hover Only - Without Background) */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
                      <div
                        className="gallery-center-icon"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.7))"
                        }}
                      >
                        {isVideo ? (
                          <Play size={56} color="#ffffff" fill="#ffffff" style={{ marginLeft: "4px" }} />
                        ) : (
                          <Eye size={46} color="#ffffff" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Text Content */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", zIndex: 2, pointerEvents: "none" }}>
                      <h3
                        style={{
                          fontSize: isTall ? "18px" : "16px",
                          fontWeight: 700,
                          margin: "0 0 4px 0",
                          color: "white",
                          lineHeight: 1.3,
                          textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                        }}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "rgba(255, 255, 255, 0.85)",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: isTall ? 3 : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Lightbox / Video Viewer Modal */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          {/* Floating Top-Right Overlay Close Button */}
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              zIndex: 10002,
              backdropFilter: "blur(4px)"
            }}
            title="Close Viewer"
          >
            <X size={24} />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "850px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
              position: "relative",
              zIndex: 10001
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                background: "white",
                flexShrink: 0
              }}
            >
              <div style={{ paddingRight: "12px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 2px 0", color: "var(--text)", lineHeight: 1.3 }}>
                  {selectedMedia.title}
                </h3>
                {selectedMedia.category && (
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                    {selectedMedia.category}
                  </span>
                )}
              </div>
            </div>

            {/* Media Body */}
            <div
              style={{
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "1 1 auto",
                minHeight: "260px",
                maxHeight: "50vh",
                overflow: "hidden"
              }}
            >
              {selectedMedia.media_type === "video" ? (
                selectedMedia.media_url.includes("youtube") || selectedMedia.media_url.includes("youtu.be") ? (
                  <iframe
                    src={selectedMedia.media_url.replace("watch?v=", "embed/")}
                    title={selectedMedia.title}
                    style={{ width: "100%", height: "100%", minHeight: "300px", maxHeight: "50vh", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={getMediaUrl(selectedMedia.media_url)}
                    controls
                    autoPlay
                    style={{ width: "100%", height: "100%", maxHeight: "50vh", objectFit: "contain" }}
                  />
                )
              ) : (
                <img
                  src={getMediaUrl(selectedMedia.media_url)}
                  alt={selectedMedia.title}
                  style={{ width: "100%", height: "100%", maxHeight: "50vh", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Modal Footer Description */}
            <div
              style={{
                padding: "16px 20px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                flexShrink: 0,
                maxHeight: "140px",
                overflowY: "auto"
              }}
            >
              {selectedMedia.description ? (
                <div>
                  <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>
                    Description
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text)", margin: 0, lineHeight: 1.4 }}>
                    {selectedMedia.description}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, fontStyle: "italic" }}>
                  No description provided for this media item.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicGalleryPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "80px", color: "var(--muted)" }}>Loading gallery...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
