import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/marketplace/guide",
  "Thapar Market guide",
  "How to verify, list second-hand items, chat and arrange a campus handover on Campus Bucket.",
);
export default function Guide() {
  return (
    <article className="policy-page market-guide">
      <span className="eyebrow">THE CAMPUS CIRCLE, EXPLAINED</span>
      <h1>
        Good finds.
        <br />
        <em>Clear ground rules.</em>
      </h1>
      <p className="lead">
        A Thapar-first student resale pilot by Campus Bucket. Independently run;
        not affiliated with or endorsed by TIET.
      </p>
      <section>
        <h2>01 / Join the circle</h2>
        <p>
          Sign in and confirm an @thapar.edu email for automatic access. If you
          use another email, submit your programme, batch and roll number for
          manual review. The team checks your student details separately before
          approval. Email access is a membership check, not a guarantee of
          someone’s identity or conduct.
        </p>
      </section>
      <section>
        <h2>02 / List something real</h2>
        <p>
          Use 1–4 photos of your actual item. Show wear, faults and missing
          accessories. Keep faces, ID cards, room numbers and private details
          out of photos. We resize uploads and remove image metadata. Give an
          honest condition, whole-rupee price (₹0 is welcome), course/semester
          tag and optional collection deadline.
        </p>
        <p>
          Listings are reviewed before publication. Editing a live listing sends
          it back for review. Listings expire after 45 days or their
          availability deadline. You can withdraw yours at any time. Maximum 10
          open listings per seller.
        </p>
        <p>
          <strong>No listing fee is collected during this pilot.</strong> A ₹10
          posting fee is planned; its payment method and start date will be
          announced before it applies. Campus Bucket does not collect payment
          for the second-hand item.
        </p>
      </section>
      <section>
        <h2>03 / Start with a conversation</h2>
        <p>
          “I’m interested” opens a private conversation and an interest
          notification for the seller. In-app notifications are available under
          Your listings. Optional email alerts cover buyer interest, saved-item
          price drops and unsold-item reminders; turn them off in Your listings.
          Email delivery depends on the seller’s mailbox and our mail provider.
        </p>
        <p>
          Chat updates automatically while the inbox is open. Only the buyer and
          seller can read their conversation. Moderators can inspect reported
          conversations to investigate abuse. Never send passwords, OTPs,
          payment PINs or identity documents in chat.
        </p>
      </section>
      <section>
        <h2>04 / Agree on a public handover</h2>
        <p>
          Propose a public campus spot and a time in Indian Standard Time. The
          other person must accept. Cafeteria and library entrances are
          suggestions, not officially monitored meetup locations. Meet in
          daylight, take a friend when possible, and inspect and test the item
          before paying. Follow campus access rules.
        </p>
        <p>
          Phone sharing is optional and requires an accepted meetup plus your
          explicit consent. Each person chooses whether to share their own
          number. You can revoke it in chat, but a number someone has already
          seen cannot be taken back. Cancelling a meetup removes shared numbers
          from the conversation.
        </p>
        <p>
          Pay the seller only when satisfied. There is no escrow, delivery
          service or buyer protection programme. Agree the price and any returns
          directly before exchanging the item. Report suspected fraud and
          contact campus security or emergency services if there is immediate
          danger.
        </p>
      </section>
      <section>
        <h2>05 / Close the loop</h2>
        <p>
          The seller can reserve the item for a conversation, then confirm the
          handover. The buyer confirms after receiving it. Only a two-sided
          confirmation counts towards the seller’s completed handovers. A count
          records confirmations, not a quality or safety guarantee. “Sold
          elsewhere” never creates a handover count.
        </p>
      </section>
      <section>
        <h2>A fair second look</h2>
        <p>
          Active unsold items at least seven days old rotate daily in Second
          look. It is not a paid boost. Sellers get at most one unsold-item
          reminder per week and choose whether to improve photos, details or
          price. Only actual reductions receive a Price dropped label. Saving an
          item subscribes you to price-drop notifications; save again to
          unsubscribe.
        </p>
      </section>
      <section>
        <h2>What stays out</h2>
        <p>
          No stolen, counterfeit, illegal or dangerous goods; weapons, drugs,
          alcohol, tobacco/vapes, medicines, financial products, accounts,
          personal data, exam papers, academic cheating services or prohibited
          campus items. No harassment, spam, impersonation, commercial bulk
          listings or advance-payment scams. Sell only items you own and may
          lawfully transfer.
        </p>
        <p>
          Use Report on a listing or conversation. The team can reject or remove
          listings and suspend access. Blocking stops new messages and
          marketplace interactions between you; existing history remains
          available. For disputes, account deletion or corrections, contact{" "}
          <a href="mailto:team@campusbucket.live">team@campusbucket.live</a>.
          Include the listing link, not passwords or payment credentials.
        </p>
      </section>
      <p>
        <Link className="button primary" href="/marketplace">
          Explore Thapar Market ↗
        </Link>
      </p>
    </article>
  );
}
