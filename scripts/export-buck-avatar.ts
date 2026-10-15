// SPDX-License-Identifier: AGPL-3.0-only
// Offline authoring helper only; neither this script nor Avatar Lab ships in the website bundle.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const root = resolve(process.argv[2] || "/tmp/campus-avatar-lab");
const revision = "79fe9ba06e4874b11394b8e8a3f2c493c9d197ba";
assert.equal(
  execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  revision,
  "Use the documented Avatar Lab revision.",
);
const { renderAvatarDefinition } = await import(
  pathToFileURL(resolve(root, "packages/avatar-core/src/scene.ts")).href
);
const definition = JSON.parse(
  readFileSync("assets/avatar/buck.avatar.json", "utf8"),
);
mkdirSync("public/avatar", { recursive: true });
const compact = (path: string) =>
  path.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 100) / 100));
for (const key of definition.expressionOrder) {
  const { geometry: g, colors } = renderAvatarDefinition(definition, key);
  for (const path of [g.headPath, g.leftPath, g.rightPath])
    assert.ok(path && !/NaN|Infinity/.test(path));
  // Original bucket handle, rim and smile accompany the studio-generated body/eye geometry.
  const mouth =
    key === "happy"
      ? "M-14 35 Q0 49 14 35"
      : key === "gentle"
        ? "M-10 42 Q0 35 10 42"
        : "M-10 38 Q0 44 10 38";
  const eyePaths = [
    g.leftVisible ? g.leftPath : "",
    g.rightVisible ? g.rightPath : "",
  ]
    .filter(Boolean)
    .map((p) => `<path d="${compact(p)}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -175 300 330" width="300" height="330"><title>Buck — ${key}</title><ellipse cx="0" cy="137" rx="69" ry="8" fill="#302d27" opacity=".1"/><path d="M-61-58V-88Q-61-143 0-143Q61-143 61-88V-58" fill="none" stroke="#71695b" stroke-width="12" stroke-linecap="round"/><path d="${compact(g.headPath)}" fill="${colors.body}" stroke="#71695b" stroke-width="2.4"/><path d="M-76-57Q0-76 76-57" fill="none" stroke="#f2eee5" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/><g fill="${colors.eyes}">${eyePaths}</g><path d="${mouth}" fill="none" stroke="${colors.eyes}" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  assert.ok(
    !/<script|foreignObject|https?:|on\w+=/i.test(
      svg.replace("http://www.w3.org/2000/svg", ""),
    ),
  );
  writeFileSync(`public/avatar/buck-${key}.svg`, svg + "\n");
}
console.log(
  `Exported ${definition.expressionOrder.length} Buck expressions from Avatar Lab ${revision.slice(0, 7)}.`,
);
const labels: Record<string, [string, string]> = {
  neutral: ["Hello, campus.", "Warm stone"],
  curious: ["Found something?", "Curious"],
  happy: ["Good find!", "Soft olive"],
  thoughtful: ["One moment.", "Thoughtful"],
  gentle: ["No rush.", "Muted clay"],
  blink: ["Little blink.", "A quiet hello"],
};
const panels = definition.expressionOrder
  .map((key: string, index: number) => {
    const x = 160 + (index % 3) * 320,
      y = 245 + Math.floor(index / 3) * 270;
    const source = readFileSync(`public/avatar/buck-${key}.svg`, "utf8");
    const art = source
      .slice(source.indexOf(">") + 1, source.lastIndexOf("</svg>"))
      .replace(/<title>.*?<\/title>/, "");
    return `<g transform="translate(${x} ${y})"><g transform="scale(.56)">${art}</g><text y="113" text-anchor="middle" font-size="21" font-weight="600">${labels[key][0]}</text><text y="138" text-anchor="middle" font-size="13" fill="#71695b">${labels[key][1]}</text></g>`;
  })
  .join("");
writeFileSync(
  "public/avatar/buck-reactions.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 740" width="960" height="740"><title>Buck — Campus Bucket reaction sheet</title><rect width="960" height="740" fill="#f2eee5"/><g font-family="Arial,sans-serif" fill="#302d27"><text x="50" y="66" font-size="37" font-weight="700" letter-spacing="-1.5">campus bucket.</text><text x="50" y="100" font-size="16" fill="#71695b">Meet Buck. Your little campus sidekick.</text><path d="M50 125H910" stroke="#cbc4b6"/>${panels}<text x="50" y="713" font-size="12" fill="#71695b">STONE / CHARCOAL / SOFT OLIVE / MUTED CLAY</text></g></svg>\n`,
);
