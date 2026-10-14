import Link from "next/link";
import { Photo } from "@/components/photo";
import { media } from "@/lib/media";
import { IconBucket, IconArrowUpRight } from "@tabler/icons-react";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/about", "Our story & contact", "Meet Campus Bucket founder Aditya Dhariwal and contact our team for college essentials and order support.");
export default function About() {
  return (
    <div className="container page about-page">
      <span className="eyebrow">FOR THE FIRST OF MANY FIRSTS</span>
      <h1>
        Less packing.
        <br />
        <span className="orange">More belonging.</span>
      </h1>
      <p className="lead">
        Moving to college is a big deal. Finding a bucket, a notebook, and a
        towel shouldn't be.
      </p>
      <div className="about-story">
        <Photo photo={media.campus} className="about-image" />
        <div>
          <IconBucket size={35} />
          <h2>
            A small idea for
            <br />a big new chapter.
          </h2>
          <p>
            Campus Bucket brings the everyday things you need into one place.
            Hostel comforts, lecture essentials, and your next workout, packed
            into kits that fit your budget.
          </p>
          <p>
            Choose Fresher for the basics, Scholar for a few thoughtful extras,
            or Topper for the whole setup. Already have half your checklist?
            Build your own.
          </p>
          <Link href="/kits" className="button primary">
            Pick your kit <IconArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <section id="founder" className="founder-section" aria-labelledby="founder-title">
        <Photo photo={media.founder} className="founder-photo" />
        <div className="founder-copy">
          <span className="eyebrow">THE PERSON BEHIND THE BUCKET</span>
          <h2 id="founder-title">Aditya Dhariwal</h2>
          <p className="founder-role">Founder of Campus Bucket</p>
          <div className="founder-links">
            <a className="text-link" href="https://www.instagram.com/aditya.100_/" target="_blank" rel="noopener noreferrer">
              Instagram · @aditya.100_ <IconArrowUpRight size={18} />
            </a>
            <a className="text-link" href="tel:+919991250707">+91 99912 50707</a>
            <a className="text-link" href="mailto:team@campusbucket.live">team@campusbucket.live</a>
          </div>
        </div>
      </section>
      <section id="faq" className="section">
        <h2>Good questions.</h2>
        {[
          [
            "What is included in each kit?",
            "Every kit detail page lists the exact items and quantities. You can compare all three tiers side by side. Item details are listed alongside each kit.",
          ],
          [
            "How do sizes work?",
            "Select a t-shirt, cap, or UK shoe size wherever relevant. The same shirt size applies to all shirts in that kit. Individual items can be added in different sizes through Build your own.",
          ],
          [
            "How does pricing work?",
            "Prices are in Indian rupees. Use CAMPUS10 for 10% off. The Ultimate Bundle combines all three Fresher kits.",
          ],
          [
            "Can I pay using UPI or a card?",
            "No payment is collected at checkout. Please contact the store team to confirm payment and fulfilment arrangements. Never share your UPI PIN or card security code.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section id="contact" className="contact-panel">
        <div>
          <span className="eyebrow">SAY HELLO</span>
          <h2>Something on your mind?</h2>
          <p>
            Questions about a kit, a campus, or your order? We'd love to help.
          </p>
        </div>
        <div>
          <a className="text-link" href="mailto:team@campusbucket.live">
            team@campusbucket.live <IconArrowUpRight size={20} />
          </a>
          <p><a className="text-link" href="tel:+919991250707">+91 99912 50707</a></p>
          <p className="small muted">
            Include your order number when asking about an order.
          </p>
        </div>
      </section>
      <section id="delivery" className="section legal">
        <h2>Delivery & returns</h2>
        <p>Choose free campus pickup or ₹49 hostel delivery, waived for totals of ₹1,499 or more after discount. Contact the store to confirm your campus, delivery timing, and pickup location before placing an order.</p>
        <p>For cancellation or return questions, email team@campusbucket.live with your order number. Please confirm the applicable terms with the store team.</p>
      </section>
      <section id="privacy" className="section legal">
        <h2>Privacy</h2>
        <p>Read our full <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms & conditions</Link>.</p>
        <p>Your bucket is saved in your browser. Account and order details are stored securely with Supabase. Customers can access their own orders; authorized store administrators manage the catalog and orders.</p>
        <p>No card details or UPI PINs are collected. Contact team@campusbucket.live for questions about your data or to request its deletion.</p>
      </section>
    </div>
  );
}
