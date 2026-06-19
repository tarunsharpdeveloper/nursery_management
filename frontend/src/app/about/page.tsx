import Image from "next/image";
import Link from "next/link";
import { Award, BadgeCheck, Headphones, Leaf, PackageCheck, ShieldCheck, Sprout, Truck, Users } from "lucide-react";

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

const services = [
  { icon: Sprout, title: "Nursery Production", text: "Fresh saplings and plant stock managed from our nursery workflow." },
  { icon: Leaf, title: "Seasonal Varieties", text: "Fruit, flower, ornamental, medicinal, and vegetable categories for every season." },
  { icon: Headphones, title: "Buying Guidance", text: "Practical help for selecting plants, seeds, and care needs before purchase." },
  { icon: Truck, title: "Order Dispatch", text: "Billing, packing, and dispatch support for online and offline customers." }
];

export default function AboutPage() {
  return (
    <main>
      <section className="about-hero">
        <div>
          <p className="eyebrow">About Us</p>
          <h1>Growing trusted nursery supply in Ujjain</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>About Us</span>
          </div>
        </div>
      </section>

      <section className="section about-intro">
        <div className="about-collage">
          <Image
            className="about-collage-main"
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80"
            alt="Rows of nursery plants"
            width={720}
            height={760}
          />
          <Image
            className="about-collage-small"
            src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=620&q=80"
            alt="Healthy green plant leaves"
            width={360}
            height={360}
          />
          <div className="experience-badge">
            <strong>Fresh</strong>
            <span>nursery stock</span>
          </div>
        </div>

        <div className="about-intro-copy">
          <p className="eyebrow">Welcome to Awantika Seeds</p>
          <h2>We provide quality plants, seeds, and dependable nursery service</h2>
          <p>
            Awantika Seeds helps gardeners, farms, and local buyers find healthy plants and reliable seeds with simple ordering, billing, and dispatch support from our Ujjain store.
          </p>
          <p>
            Our focus is practical: stock that is fresh, categories that are easy to browse, and guidance that helps customers choose the right product before they plant.
          </p>

          <div className="about-check-grid">
            <span><ShieldCheck size={18} /> Quality checked plants</span>
            <span><Leaf size={18} /> Plant based nursery supply</span>
            <span><BadgeCheck size={18} /> Trusted local service</span>
          </div>

          <div className="specialist-card">
            <div className="specialist-mark">
              <Award size={28} />
            </div>
            <div>
              <h3>Nursery and seed specialist</h3>
              <p className="meta">Plants, seeds, saplings, billing, stock, and customer orders managed under one roof.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="section-header centered">
          <div>
            <p className="eyebrow">Our Process</p>
            <h2>Simple steps from selection to delivery</h2>
          </div>
        </div>
        <div className="process-grid">
          {processSteps.map((step, index) => (
            <div className="process-card" key={step.title}>
              <span className="process-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="meta">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-stats">
        <div>
          <strong>6+</strong>
          <span>Product Categories</span>
        </div>
        <div>
          <strong>1000+</strong>
          <span>Local Customers Served</span>
        </div>
        <div>
          <strong>24 hr</strong>
          <span>Order Follow-up</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>Nursery Focused</span>
        </div>
      </section>

      <section className="section about-services">
        <div className="section-header centered">
          <div>
            <p className="eyebrow">Services and Benefits</p>
            <h2>Built for gardeners, farms, and nursery buyers</h2>
          </div>
        </div>
        <div className="service-grid">
          {services.map(({ icon: Icon, title, text }) => (
            <div className="service-card" key={title}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p className="meta">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section about-cta">
        <div>
          <p className="eyebrow">Need help choosing?</p>
          <h2>Tell us what you want to grow</h2>
          <p>We can guide you toward the right plants, seeds, quantities, and pickup or dispatch plan.</p>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/products">
            Browse Products
          </Link>
          <Link className="button secondary" href="/contact">
            Contact Store
          </Link>
        </div>
      </section>
    </main>
  );
}
