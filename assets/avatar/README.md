# Buck · Campus Bucket companion

Custom authoring definition and exported artwork for Campus Bucket. Rounded bucket silhouette, handle, warm neutral body, charcoal eyes; olive celebration and muted clay reassurance.

## Source tool

Created with the geometry renderer from [Bible Strong Avatar Lab](https://github.com/smontlouis/bible-strong-avatar-lab), by Stéphane Montlouis-Calixte, pinned to `79fe9ba06e4874b11394b8e8a3f2c493c9d197ba`.

The upstream project is AGPL-3.0-only. It is used as an **offline authoring tool**. The website uses only the exported SVG artwork and original interaction code; no upstream engine, Studio code, stock avatar or preset-expression library is bundled. No website-wide licence was changed. The custom definition was authored independently for Campus Bucket; the handle, rim and mouth are original additions.

The offline reproduction helper `scripts/export-buck-avatar.ts` is provided under AGPL-3.0-only, with the licence at `scripts/avatar-export-LICENSE.txt`. The complete renderer source remains available at the pinned upstream repository. GNU's discussion of generated output: https://www.gnu.org/licenses/gpl-faq.en.html#WhatCaseIsOutputGPL

## Re-export after editing

```sh
git clone https://github.com/smontlouis/bible-strong-avatar-lab.git /tmp/campus-avatar-lab
git -C /tmp/campus-avatar-lab checkout 79fe9ba06e4874b11394b8e8a3f2c493c9d197ba
node --import tsx scripts/export-buck-avatar.ts /tmp/campus-avatar-lab
```

The helper calls the upstream geometry renderer directly; it does not need an install of the Studio UI or change project dependencies. The JSON can also be used in the upstream React/Web renderers if a future integration deliberately chooses that runtime and its licensing requirements.

## Reactions

| Moment | Expression | Body colour |
| --- | --- | --- |
| Home / general browsing | Neutral, one introductory blink | Warm stone `#c8beab` |
| Kits / Thapar Market | Curious | Warm stone `#c8beab` |
| Actual cart quantity increase / tapped greeting | Happy | Soft olive `#b8c2a4` |
| Loading / reviewing the cart | Thoughtful | Greige `#bcb4a6` |
| Store error | Gentle | Muted clay `#c8afa4` |

Buck is a small visual companion, not an AI agent, support chat, safety badge or order-status source. It reads no form values and makes no network calls. It uses existing route, ready/error and cart-count state. Cart hydration does not count as an add. Motion is finite and disabled under reduced-motion preference. It stays off admin, login, checkout, selling and inbox pages, and hides while forms or native dialogs are active. Visitors can close the greeting without dismissing Buck.
