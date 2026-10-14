import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/terms", "Terms & conditions", "Ordering, delivery, cancellations and use of the Campus Bucket store.");
export default function Terms() {
  return <article className="container page policy-page">
    <span className="eyebrow">THE SMALL PRINT · UPDATED 15 OCTOBER 2026</span>
    <h1>Terms & conditions.</h1>
    <p className="lead">The essentials for shopping with Campus Bucket.</p>
    <section><h2>About the store</h2><p>Campus Bucket, founded by Aditya Dhariwal, offers kits and individual essentials for college life. Contact <a href="mailto:team@campusbucket.live">team@campusbucket.live</a> or <a href="tel:+919991250707">+91 99912 50707</a> for order questions. These terms apply when you use this website or place an order.</p></section>
    <section><h2>Your account</h2><p>Provide accurate contact and delivery details and keep your sign-in credentials private. Only place orders you are authorised to make. Do not misuse the website, create spam accounts, interfere with other customers, or attempt unauthorised access.</p></section>
    <section><h2>Products, prices & availability</h2><p>Prices are shown in Indian rupees. Review the items, quantities, sizes, discounts and delivery charge at checkout. Product availability and campus coverage may change. An order receipt acknowledges your request; if an item cannot be supplied, our team will contact you before making a substitution or arranging a resolution.</p></section>
    <section><h2>Delivery & pickup</h2><p>Campus pickup is free. Hostel delivery is ₹49, waived for orders of ₹1,499 or more after discount. Confirm coverage and timing with our team before ordering. Supply a reachable phone number and the correct campus, hostel and room details. Delivery estimates depend on stock and campus access.</p></section>
    <section><h2>Payment</h2><p>The current website does not collect online payments. Never share a card PIN, UPI PIN, password or one-time code with our team. Any future payment methods and applicable charges will be shown before you authorise payment.</p></section>
    <section><h2>Cancellations, returns & problems</h2><p>Contact our team with your order number as soon as you need to cancel or change an order. Cancellation depends on whether packing or dispatch has started. For missing, damaged, defective or incorrect items, describe the problem and keep the packaging and any relevant photographs so we can assess it and arrange an appropriate resolution. Contact us before returning items. These terms do not remove any rights you have under applicable law.</p></section>
    <section><h2>Using this website</h2><p>Website content and branding may not be copied or misused without permission. We may restrict abusive activity and correct genuine catalog errors. We aim to keep the site available but cannot guarantee uninterrupted access.</p></section>
    <section><h2>Privacy & updates</h2><p>Our <Link href="/privacy">privacy policy</Link> explains how we handle information. Changes to these terms will be dated on this page. Contact us if you need help understanding an order or these terms.</p></section>
  </article>;
}
