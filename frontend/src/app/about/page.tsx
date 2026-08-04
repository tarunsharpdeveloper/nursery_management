"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const processSteps = [
  {
    title: "Choose Your Plants",
    text: "Browse seasonal saplings, flowering plants, vegetable seeds, and nursery essentials."
  },
  {
    title: "Confirm Your Order",
    text: "Our team checks stock, billing details, and the right quantity for your garden or farm."
  },
  {
    title: "Pickup or Dispatch",
    text: "Collect from our Ujjain store or coordinate dispatch for healthy, carefully packed plants."
  }
];

// ── Scroll-Triggered Animated Counter ──────────────────────────────────────
function AnimatedCounter({ end, duration = 2200, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOutProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutPage() {
  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">About us</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>About us</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* breadcumb End */}

      {/* About Area Start */}
      <section className="about-layout1 space-top z-index-common space-extra-bottom">
        <img src="/assets/img/about/about-ele1-1.png" alt="about element" className="about-ele1" />
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-30">
              <div className="img-box1">
                <div className="img1">
                  <img className="img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj64W6Yhp2BLcBoHVPk2pQeqJx-HbiJXtTpWPoQpkATQ&s=10" alt="about 1 1" />
                </div>
                <div className="video-thumb1">
                  <img className="img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLvX2WV6_Uck7fxt9yiwYPUV43XfKB_o_FGI74BTJAualpPZ-yEvrP7TF9&s=10" alt="about 2 2" />
                  <a href="#" className="play-btn style7 popup-video" tabIndex={0}><i className="fas fa-play"></i></a>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-30">
              <div className="about-content1">
                <div className="title-area">
                  <span className="sec-subtitle">Welcome to Awantika Seeds</span>
                  <h2 className="sec-title">We provide quality plants, seeds, and dependable nursery service</h2>
                </div>
                <div className="about-body">
                  <p className="about-text">Awantika Seeds helps gardeners, farms, and local buyers find healthy plants and reliable seeds with simple ordering, billing, and dispatch support from our Ujjain store.</p>
                  <p className="about-text">Our focus is practical: stock that is fresh, categories that are easy to browse, and guidance that helps customers choose the right product before they plant.</p>
                  <div className="list-style1">
                    <ul>
                      <li><i><img src="/assets/img/icons/shield.png" alt="shield" /></i>Quality checked plants</li>
                      <li><i><img src="/assets/img/icons/marijuana.png" alt="leaf" /></i>Plant based nursery supply</li>
                      <li><i><img src="/assets/img/icons/microscope.png" alt="badge" /></i>Trusted local service</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* About Area End */}

      {/* Feature Area */}
      <section className="space-top space-bottom z-index-common" style={{ backgroundImage: "url('/assets/img/bg/bg-1-1.jpg')" }}>
        <img src="/assets/img/leafs/feature-3-1.png" alt="feature element 1" className="feature-element1" />
        <div className="container">
          <div className="row">
            <div className="col-lg-7 mx-auto">
              <div className="title-area text-center">
                <span className="sec-subtitle">Our Process</span>
                <h2 className="sec-title">Simple steps from selection to delivery</h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-6 col-lg-6 mb-30">
              {processSteps.map((step, index) => (
                <div className="feature-item style3" key={index}>
                  <div className="feature-icon">
                    <img src={`/assets/img/icons/feature-3-${index + 1}.png`} alt={`feature 3 ${index + 1}`} />
                    <span className="feature-number">{index + 1}.</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">{step.title}</h3>
                    <p className="feature-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-xl-6 col-lg-auto mb-30">
              <div className="img-box7">
                <img src="https://static.vecteezy.com/system/resources/thumbnails/080/863/023/small/vibrant-foliage-of-a-peperomia-plant-also-known-as-a-baby-rubber-plant-or-green-succulent-showing-shiny-textured-surfaces-this-indoor-greenery-thrives-in-bright-light-photo.jpg" alt="feature-img" className="img1" />
                <a href="#" className="play-btn style5 popup-video"><i className="fas fa-play"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Area End */}

      {/* ── Modern Trust Statistics Section ── */}
      <div className="space-top space-extra-bottom">
        <div className="container">
          <div className="home-stats-section" style={{ marginTop: 0 }}>
            <div className="row g-3 g-md-4 justify-content-center">
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <img src="/assets/img/icons/count-1-1.png" alt="categories" />
                  </div>
                  <div className="stat-number-wrap">
                    <AnimatedCounter end={6} suffix="+" />
                  </div>
                  <div className="stat-title">Product Categories</div>
                  <div className="stat-subtext">Plants &amp; Seeds Varieties</div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <img src="/assets/img/icons/count-1-2.png" alt="customers" />
                  </div>
                  <div className="stat-number-wrap">
                    <AnimatedCounter end={1000} suffix="+" />
                  </div>
                  <div className="stat-title">Local Customers Served</div>
                  <div className="stat-subtext">Trusted Across Ujjain &amp; MP</div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <img src="/assets/img/icons/count-1-3.png" alt="follow-up" />
                  </div>
                  <div className="stat-number-wrap">
                    <AnimatedCounter end={24} suffix=" hr" />
                  </div>
                  <div className="stat-title">Order Follow-up</div>
                  <div className="stat-subtext">Quick Dispatch Assistance</div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <img src="/assets/img/icons/count-1-4.png" alt="nursery" />
                  </div>
                  <div className="stat-number-wrap">
                    <AnimatedCounter end={100} suffix="%" />
                  </div>
                  <div className="stat-title">Nursery Focused</div>
                  <div className="stat-subtext">Dedicated Plant Expertise</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Counter Area End */}

      {/* Services Area */}
      <section className="space-top space-bottom z-index-common" style={{ backgroundImage: "url('/assets/img/bg/bg-1-1.jpg')" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="title-area z-index-common text-center">
                <div className="sec-icon">
                  <img src="/assets/img/icons/s-1-1.png" alt="icon" />
                </div>
                <span className="sec-subtitle">Our Services and Benefits</span>
                <h2 className="sec-title" style={{ fontSize: "55px" }}>Built for gardeners, farms, and nursery buyers</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xxl-4 col-xl-4 col-lg-7 mx-auto mb-30">
              <div className="feature-item style4">
                <div className="feature-content">
                  <h3 className="feature-title">Nursery Production</h3>
                  <p className="feature-text">
                    Fresh saplings and plant stock managed from our nursery workflow.
                  </p>
                </div>
                <div className="feature-icon">
                  <img src="/assets/img/icons/about-p-i-1-1.png" alt="about-p-i-1-1" />
                </div>
              </div>
              <div className="feature-item style4">
                <div className="feature-content">
                  <h3 className="feature-title">Seasonal Varieties</h3>
                  <p className="feature-text">
                    Fruit, flower, ornamental, medicinal, and vegetable categories for every season.
                  </p>
                </div>
                <div className="feature-icon">
                  <img src="/assets/img/icons/about-p-i-1-2.png" alt="about-p-i-1-2" />
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-4 col-lg-auto mx-auto mb-30">
              <div className="img-box8" style={{ maxWidth: '100%', height: 'auto' }}>
                <img src="/assets/img/about/about-p-1-1.png" alt="feature-img" className="about-feature-img" />
              </div>
            </div>
            <div className="col-xxl-4 col-xl-4 col-lg-7 mx-auto mb-30">
              <div className="feature-item style4">
                <div className="feature-icon">
                  <img src="/assets/img/icons/about-p-i-1-4.png" alt="about-p-i-1-4" />
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">Buying Guidance</h3>
                  <p className="feature-text pe-0">
                    Practical help for selecting plants, seeds, and care needs before purchase.
                  </p>
                </div>
              </div>
              <div className="feature-item style4">
                <div className="feature-icon">
                  <img src="/assets/img/icons/about-p-i-1-5.png" alt="about-p-i-1-5" />
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">Order Dispatch</h3>
                  <p className="feature-text pe-0">
                    Billing, packing, and dispatch support for online and offline customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Services Area End */}

    </main>
  );
}
