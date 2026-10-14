"use client";
import { useId, useState } from "react";
export const questions = [
  [
    "Fresher, Scholar, Topper. What's the difference?",
    "Fresher covers the basics. Scholar adds everyday comforts. Topper gives you the fuller setup. Every kit page lists the exact items and quantities in each tier.",
  ],
  [
    "Can I leave out the things I already own?",
    "Yes. Build your own lets you pick individual essentials, choose sizes, and see your running total.",
  ],
  [
    "Will you deliver to my hostel?",
    "Choose hostel delivery or campus pickup at checkout. Contact us to confirm coverage and timing at your campus.",
  ],
  [
    "How do I track my order?",
    "Sign in and open Track order. Your order moves through Placed, Packed, Out for delivery, and Delivered as the team updates it.",
  ],
  [
    "What about returns?",
    "Contact team@campusbucket.live with your order number for cancellation or return questions. Confirm the applicable terms with the store before placing an order.",
  ],
];
export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  return (
    <div className="faq-list">
      {questions.map(([q, a], i) => (
        <div className="faq-item" key={q}>
          <h3>
            <button
              aria-expanded={open === i}
              aria-controls={`${id}-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {q}
              <span aria-hidden="true">{open === i ? "−" : "+"}</span>
            </button>
          </h3>
          <div
            className={`faq-answer ${open === i ? "is-open" : ""}`}
            id={`${id}-${i}`}
            inert={open !== i}
          >
            <div>
              <p>{a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
