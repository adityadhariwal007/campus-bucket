"use client";
import { IconCheck, IconPackage } from "@tabler/icons-react";
import { money, kitLabel } from "@/lib/catalog";
import { statuses, type Order } from "@/lib/types";
export function OrderCard({
  order,
  expanded = false,
}: {
  order: Order;
  expanded?: boolean;
}) {
  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <article className="order-card">
      <div className="row between">
        <div className="row">
          <span className="order-icon">
            <IconPackage />
          </span>
          <div>
            <strong>CB-{order.id.slice(0, 8).toUpperCase()}</strong>
            <p className="small muted">Placed {date}</p>
          </div>
        </div>
        <strong>{money(order.total)}</strong>
      </div>
      <ol className="order-progress">
        {statuses.map((s, i) => (
          <li
            key={s}
            className={i <= statuses.indexOf(order.status) ? "done" : ""}
          >
            <span>
              {i <= statuses.indexOf(order.status) ? (
                <IconCheck size={15} />
              ) : (
                i + 1
              )}
            </span>
            <small>{s}</small>
          </li>
        ))}
      </ol>
      <details open={expanded}>
        <summary>
          Order details <span>+</span>
        </summary>
        <div className="order-details">
          {order.items.map((i, index) => (
            <div className="row between" key={index}>
              <span>
                {i.quantity} × {kitLabel(i.name)}
                <small className="muted">
                  {" "}
                  {Object.entries(i.sizes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </small>
                {i.kind === "kit" && i.contents && (
                  <small
                    className="muted"
                    style={{ display: "block", marginTop: 6 }}
                  >
                    Per kit:{" "}
                    {i.contents
                      .map((c) => `${c.quantity} × ${c.name}`)
                      .join(", ")}
                  </small>
                )}
              </span>
              <span>{money(i.quantity * i.price)}</span>
            </div>
          ))}
          <hr />
          <p>
            <strong>
              {order.customer.delivery === "pickup"
                ? "Campus pickup"
                : "Hostel delivery"}
            </strong>
            <br />
            {order.customer.campus}
            {order.customer.address && ` · ${order.customer.address}`}
          </p>
          <p className="small muted">
            Subtotal {money(order.subtotal)} · Discount {money(order.discount)}{" "}
            · Delivery {money(order.delivery_fee)}
          </p>
          <p className="small muted break-word">
            Payment: {order.payment_id.startsWith("mock_") ? "Not collected" : "Recorded"}
          </p>
          <p className="small muted">
            This test order does not arrange a real delivery.
          </p>
        </div>
      </details>
    </article>
  );
}
