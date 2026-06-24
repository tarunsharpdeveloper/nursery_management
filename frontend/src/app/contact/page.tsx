import Link from "next/link";

const mapUrl = "https://www.google.com/maps?q=23.180056,75.779583&output=embed";
const directionsUrl = "https://www.google.com/maps/place/23%C2%B010'48.2%22N+75%C2%B046'46.5%22E";

export default function ContactPage() {
  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/lush-green-plant-against-dark-textured-background_84443-83815.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Contact Us</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>Contact Us</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* breadcumb End */}

      {/* Contact Area */}
      <section className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-7 mx-auto">
              <div className="title-area text-center">
                <div className="sec-icon">
                  <img src="/assets/img/icons/s-1-1.png" alt="icon" />
                </div>
                <h2 className="sec-title">We Are Here For You!</h2>
                <p>If your query is relating to finding out more information about our products or placing an order, then please feel free to contact us.</p>
              </div>
            </div>
          </div>
          <div className="contact-wrapper">
            <div className="row gx-0">
              <div className="col-lg-4 contact-box" style={{ backgroundImage: "url('/assets/img/pattern/pattern-4-1.png')" }}>
                <h3 className="contact-box__title">Head Office</h3>
                <div className="contact-box__item">
                  <div className="contact-box__icon"><i className="far fa-location"></i></div>
                  <div className="media-body">
                    <p className="contact-box__info">
                      Dhudh Talai, Kamal Talkies 7,<br /> Ujjain, Madhya Pradesh 456001
                    </p>
                  </div>
                </div>
                <div className="contact-box__item">
                  <div className="contact-box__icon"><i className="far fa-phone-alt"></i></div>
                  <div className="media-body">
                    <h4 className="contact-box__label">Phone No:</h4>
                    <p className="contact-box__info">
                      <a href="tel:+918085263020">+91 80852 63020</a>
                    </p>
                  </div>
                </div>
                <div className="contact-box__item">
                  <div className="contact-box__icon"><i className="far fa-envelope"></i></div>
                  <div className="media-body">
                    <h4 className="contact-box__label">Email Address:</h4>
                    <p className="contact-box__info">
                      <a href="mailto:sales@greennursery.local">sales@greennursery.local</a>
                    </p>
                  </div>
                </div>
                <div className="contact-box__item">
                  <div className="contact-box__icon"><i className="far fa-clock"></i></div>
                  <div className="media-body">
                    <p className="contact-box__info">
                      <span>Mon-Sat: 9am - 7pm</span>
                      <span>Sun: Closed</span>
                    </p>
                  </div>
                </div>
                <div className="social-links pt-10">
                  <span className="links-title">Get Directions:</span>
                  <ul>
                    <li><a href={directionsUrl} target="_blank" rel="noopener noreferrer"><i className="fas fa-map-marker-alt"></i></a></li>
                    <li><a href="https://wa.me/918085263020" target="_blank" rel="noopener noreferrer"><i className="fab fa-whatsapp"></i></a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-7 form-style2">
                <form className="ajax-contact" action="#" method="POST">
                  <h3 className="contact-box__title">General Query</h3>
                  <p className="contact-box__text">Share your requirement and our team will help with availability, quantity, price, and pickup or delivery details.</p>
                  <div className="row gx-20">
                    <div className="col-md-6 form-group">
                      <input className="form-control" type="text" name="name" id="name" placeholder="Your Name" />
                    </div>
                    <div className="col-md-6 form-group">
                      <input className="form-control" type="email" name="email" id="email" placeholder="Email Address" />
                    </div>
                    <div className="col-md-12 form-group">
                      <input className="form-control" type="tel" name="tel" id="tel" placeholder="Phone No" />
                    </div>
                    <div className="col-12 form-group">
                      <textarea className="form-control" name="message" id="message" placeholder="Type Your Message"></textarea>
                    </div>
                    <div className="col-12">
                      <button type="button" className="vs-btn style1">Submit Message<i className="far fa-arrow-right"></i></button>
                    </div>
                  </div>
                </form>
                <p className="form-messages mb-0 mt-3"></p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Area End */}

      <div className="map-sec pb-120">
        <iframe src={mapUrl} style={{ width: '100%', height: '500px', border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </main>
  );
}
