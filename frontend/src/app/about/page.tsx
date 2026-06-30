import Image from "next/image";
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

export default function AboutPage() {
  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://t3.ftcdn.net/jpg/03/61/44/76/360_F_361447601_xgUiLE3tNHW7sdI01beMHPTp2VPzTL8G.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
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

      {/* Featue Area */}
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
                {/* <img src="/assets/img/leafs/feature-3-2.png" alt="leafs" className="img2" />
                <img src="/assets/img/leafs/feature-3-3.png" alt="leafs" className="img3" />
                <img src="/assets/img/leafs/feature-3-4.png" alt="leafs" className="img4" /> */}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Area End */}

      {/* Counter Area */}
      <div className="space-extra-bottom space-top">
        <div className="container">
          <div className="counter-wrap2">
            <div className="row justify-content-between">
              <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6">
                <div className="counter-media">
                  <div className="counter-media__icon">
                    <img src="/assets/img/icons/count-1-1.png" alt="icon" />
                  </div>
                  <div className="media-body">
                    <h3 className="counter-media__title"><span className="counter-media__number">6</span>+</h3>
                    <p className="counter-media__text">Product Categories</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6">
                <div className="counter-media">
                  <div className="counter-media__icon">
                    <img src="/assets/img/icons/count-1-2.png" alt="icon" />
                  </div>
                  <div className="media-body">
                    <h3 className="counter-media__title"><span className="counter-media__number">1000</span>+</h3>
                    <p className="counter-media__text">Local Customers Served</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6">
                <div className="counter-media">
                  <div className="counter-media__icon">
                    <img src="/assets/img/icons/count-1-3.png" alt="icon" />
                  </div>
                  <div className="media-body">
                    <h3 className="counter-media__title"><span className="counter-media__number">24</span> hr</h3>
                    <p className="counter-media__text">Order Follow-up</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6">
                <div className="counter-media">
                  <div className="counter-media__icon">
                    <img src="/assets/img/icons/count-1-4.png" alt="icon" />
                  </div>
                  <div className="media-body">
                    <h3 className="counter-media__title"><span className="counter-media__number">100</span>%</h3>
                    <p className="counter-media__text">Nursery Focused</p>
                  </div>
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
                <h2 className="sec-title">Built for gardeners, farms, and nursery buyers</h2>
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
                <img 
                  src="/assets/img/about/about-p-1-1.png" 
                  alt="feature-img" 
                  className="img1"
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: 'auto',
                    objectFit: 'contain',
                    margin: '0 auto',
                    display: 'block'
                  }}
                />
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
