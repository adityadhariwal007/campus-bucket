"use client";
import { sizes } from "@/lib/catalog";
import { contents } from "@/lib/commerce";
import { useStore } from "./store";
import type { CartLine } from "@/lib/types";
export function SizeSelect({
  line,
  value,
  onChange,
}: {
  line: Pick<CartLine, "kind" | "id">;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const { catalog } = useStore();
  const types = [
    ...new Set(
      contents(line, catalog)
        .map(
          (i) => catalog.products.find((p) => p.id === i.product_id)?.size_type,
        )
        .filter(Boolean),
    ),
  ] as (keyof typeof sizes)[];
  return (
    <>
      {types.map((type) => (
        <fieldset key={type} className="size-field">
          <legend>
            {type === "shirt"
              ? "T-shirt size"
              : type === "cap"
                ? "Cap size"
                : "Shoe size (UK)"}{" "}
            <span className="muted small">Required</span>
          </legend>
          <div className="size-options">
            {sizes[type].map((s) => (
              <button
                type="button"
                key={s}
                aria-pressed={value[type] === s}
                className={value[type] === s ? "selected" : ""}
                onClick={() => onChange({ ...value, [type]: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}
