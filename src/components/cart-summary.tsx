"use client";
import { money } from "@/lib/catalog";
export function CartSummary({
  amount,
}: {
  amount: {
    subtotal: number;
    discount: number;
    delivery_fee: number;
    total: number;
  };
}) {
  return (
    <div className="summary-lines">
      <div>
        <span>Subtotal</span>
        <span>{money(amount.subtotal)}</span>
      </div>
      {amount.discount > 0 && (
        <div className="discount">
          <span>CAMPUS10 savings</span>
          <span>−{money(amount.discount)}</span>
        </div>
      )}
      <div>
        <span>Delivery</span>
        <span>{amount.delivery_fee ? money(amount.delivery_fee) : "Free"}</span>
      </div>
      <div className="summary-total">
        <strong>Total</strong>
        <strong>{money(amount.total)}</strong>
      </div>
      <p className="small muted">All prices include taxes.</p>
    </div>
  );
}
