# Portfolio — Horizontal Editorial

## Authority and mode
**Mode: Experience.** Implement the user's supplied Subframe design rather than inventing a new visual direction.

Canvas: https://app.subframe.com/348a99d30c22/canvas/7765d0ca-ba94-484d-b213-d20cf59da34b/edit

Reference pages:
- `f149094e-1fee-402e-8f16-d07f9df6b732`: complete sequence / Intro
- `cb704fcf-804b-4568-bb09-a4f7f1011928`: About
- `e3e39ca5-b6bb-4577-9b65-3519ffb436ec`: Skills
- `0777e339-5cb1-48c4-b91e-515c2fb4fe25`: Contact

Codebase owns implementation; Subframe is a read-only visual reference. No Subframe sync, React migration or external runtime dependency.

## Visual system
- Local Figtree variable family, normal weights 400–700.
- Paper `#f2f0e9`; ink `#171717`; About sage `#e4e7dd`; Contact/accent yellow `#ffc300`.
- Rules: paper `#cccfc3`, sage `#aeb4a5`, yellow `#a37e05`; skill-level text `#565d51`.
- Header: 24px/32px bold wordmark, 14px/20px supporting links; 40px horizontal and 24px vertical padding.
- Chapters: 40px desktop padding; 20px horizontal mobile padding. Sparse typographic composition, no cards/shadows/globe, no automatic dark theme.
- Intro: 150px/140px, weight 600, tracking -0.04em; 96×12px yellow accent; 26px/34px supporting copy.
- About/Skills headings: 76px/80px, weight 500, tracking -0.04em. About heading max-width 800px; two equal text columns separated by 64px.
- Contact heading: 96px/96px, weight 500, max-width 850px; email 32px/40px, underlined.
- Mobile: Intro 92px/96px; About/Skills 48px/52px; Contact 60px/64px; single-column copy/skill rows; email 22px/33px. Narrow-screen adjustments must prevent overflow without changing the hierarchy.
- Footer chapter links: 14px/20px; active chapter weight 600 and underline. Preserve visible keyboard focus, selection colors, reduced-motion support and real anchor links.

## Layout and interaction
Desktop (≥768px): four horizontally arranged viewport-width chapters with snap, persistent paper header and chapter navigation. Wheel, native horizontal trackpad, anchor links and keyboard navigation. Main chapter area grows with the viewport, with a 650px minimum chapter height; short screens permit vertical access rather than clipping content.

Desktop vertical-wheel input chooses the destination immediately once accumulated intent reaches 24px (line/page wheel units are normalized). A small notch advances in its direction rather than snapping back; sustained input can extend the destination. Run one bounded cubic ease-out directly to the chapter, approximately 400–560ms depending on distance. No preliminary pixel drift, no idle-timer snap, and no second acceleration. Further events for the same destination do not restart the animation; reversing direction or using navigation retargets from the rendered position. Temporarily suspend CSS snap during programmatic motion so the browser and animator do not compete. Horizontal trackpad gestures and mobile vertical scrolling stay native. Reduced motion uses immediate positioning. Frame-sampling regression tests check early progress, continuous motion, deceleration and bounded completion, in addition to reachability.

Mobile (≤767px): native vertical sequence, no horizontal document scroll. Header and chapter navigation remain accessible; navigation tracks the visible chapter. Honor direct section hashes, browser history and live resizing across the breakpoint.

The Subframe editor captures use a fixed 650px chapter followed by unused canvas height. The running desktop website fills its viewport as directed by the project's design document, rather than reproducing editor-only blank space. Interactive links replace the static spans in the design. Existing X/WhatsApp URLs remain in hidden markup; Projects/CV remain unexposed. The wedding link stays discreetly in Contact, with the wedding page itself untouched.

## Verification
Compare screenshots at the reference widths (984px Intro, 1100px other chapters), plus common desktop/mobile widths. Check all four chapters, typography, palette and spacing; then browser-test scroll, keyboard, hashes, responsive resizing, reduced motion, no-JS anchors and `/our-wedding/` direct access. Browser artifacts belong in ignored `test-results/`, not production assets.
