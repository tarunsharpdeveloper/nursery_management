"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const mapUrl = "https://www.google.com/maps?q=23.180056,75.779583&output=embed";
const directionsUrl = "https://www.google.com/maps/place/23%C2%B010'48.2%22N+75%C2%B046'46.5%22E";

export default function ContactPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tel: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.tel.trim()) {
      newErrors.tel = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.tel.replace(/\D/g, ''))) {
      newErrors.tel = "Phone number must be exactly 10 digits";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("/api/contact/submit", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.tel.replace(/\D/g, ''), // Remove non-digits
          message: formData.message
        })
      });

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        tel: "",
        message: ""
      });
      setErrors({});
      showToast("Thank you for contacting us! We will get back to you soon.", "success");

      // Reset submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error: any) {
      const errorMessage = error?.fieldErrors?.form || error?.message || "Failed to submit the form. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
                <form onSubmit={handleSubmit} className="contact-form">
                  <h3 className="contact-box__title">General Query</h3>
                  <p className="contact-box__text">Share your requirement and our team will help with availability, quantity, price, and pickup or delivery details.</p>
                  
                  {submitted && (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                      ✓ Thank you for contacting us! We will get back to you soon.
                    </div>
                  )}

                  <div className="row gx-20">
                    <div className="col-md-6 form-group">
                      <input
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.name && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
                    </div>
                    <div className="col-md-6 form-group">
                      <input
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.email && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
                    </div>
                    <div className="col-md-12 form-group">
                      <input
                        className={`form-control ${errors.tel ? 'is-invalid' : ''}`}
                        type="tel"
                        name="tel"
                        id="tel"
                        placeholder="Phone No (10 digits)"
                        value={formData.tel}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.tel && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.tel}</div>}
                    </div>
                    <div className="col-12 form-group">
                      <textarea
                        className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                        name="message"
                        id="message"
                        placeholder="Type Your Message"
                        value={formData.message}
                        onChange={handleChange}
                        disabled={loading}
                        rows={5}
                      ></textarea>
                      {errors.message && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.message}</div>}
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        className="vs-btn style1"
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1 }}
                      >
                        {loading ? "Submitting..." : "Submit Message"}<i className="far fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </form>
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
