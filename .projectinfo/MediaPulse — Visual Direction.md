# MediaPulse — Visual Direction

**Status:** Locked for Phase 3, Task 3.1  
**Applies to:** Landing, adaptive interview, analysis, results, movie cards, and profile card

## Product character

MediaPulse should feel like a thoughtful movie discovery experience with the atmosphere of a small, beautifully curated screening room. It is cinematic, modern, atmospheric, premium, minimal, and slightly mysterious. The interface should make the user feel that their taste is being noticed and interpreted, rather than processed by a generic AI utility.

The visual language balances two qualities:

- **Cinematic and expressive:** editorial composition, intentional contrast, evocative movie imagery, and moments of reveal.
- **Clear and dependable:** readable type, familiar controls, direct feedback, and predictable navigation.

Personality comes from art direction and content hierarchy, not visual noise. The product should remain welcoming and easy to use.

## Visual concept

Use a dark, ink-like foundation that recalls a theater before a screening. Layered surfaces should feel quiet and dimensional, with restrained light used to guide attention. Movie artwork can supply richer color and texture; the interface chrome should stay controlled so posters and the user's personality remain the focus.

The visual direction should avoid literal film equipment and generic “AI” decoration. Do not rely on film-strip borders, clapperboards, camera icons, glowing circuit patterns, arbitrary data dashboards, or decorative gradients that compete with content. Avoid making every surface equally dark and flat; separate hierarchy with spacing, contrast, imagery, and subtle surface changes.

## Color philosophy

- Keep the overall canvas dark and the primary text a soft, high-contrast light neutral.
- Use quiet charcoal/ink surfaces and fine neutral borders to distinguish layers without heavy shadows.
- Give the primary action one warm, cinematic accent. Use it sparingly for the main call to action, selected states, and a few meaningful highlights.
- Keep secondary text subdued but comfortably readable. Status colors communicate status and should not become brand decoration.
- Let posters and film stills provide most of the saturated color. Do not tint the whole product with competing neon hues.

This locks the color behavior and roles, not the final hex values; semantic tokens and contrast checks belong to Task 3.3.

## Typography direction

Use a contemporary sans-serif for interface copy, body text, labels, and controls. Pair it with a more expressive editorial display face for the main brand statement and the user's movie-personality title. The display face should feel literary and cinematic, not ornate or retro. Keep the pairing restrained: one display voice and one practical interface voice.

Titles should have a clear, confident hierarchy. Body copy should be calm, conversational, and easy to scan. Use uppercase or tracked lettering only for short utility labels, never for paragraphs or long headings. Final font choices, sizes, and line-height rules belong to Task 3.2.

## Composition and spacing

- Give the main message and primary action room to breathe; avoid filling every viewport with content.
- Use a clear content column for reading and a wider composition only when imagery or movie collections benefit from it.
- Keep related controls close together and use larger spacing to distinguish sections and stages.
- Let each interview screen focus on one question and its choices. The progress and navigation controls remain visible without competing with the question.
- On small screens, preserve the same hierarchy in a single column; do not shrink desktop compositions until text and touch targets become cramped.

Exact container widths, grids, and spacing steps belong to Task 3.4.

## Surfaces, cards, and shape

Surfaces are quiet frames for content, not decoration. Use a subtle fill and fine border where a boundary helps scanning or interaction. Reserve stronger elevation and contrast for the currently important surface. Avoid stacking borders inside borders or placing every paragraph in a card.

Movie cards should prioritize poster art, then title and useful metadata, then the personalized reason. Keep poster proportions intact and avoid cropping artwork in a way that removes essential title imagery. Personality and interview cards may use more open space and less framing than movie cards.

Use moderate corner rounding for panels and controls. Reserve full pills for compact badges and status labels. Avoid both sharp, industrial edges and heavily rounded “bubble” UI. Exact radius values belong to the token task.

## Actions and interaction feedback

- Make the primary action visually obvious with the warm accent and a clear verb.
- Give secondary actions quieter outlined or text treatments; avoid presenting several actions with equal weight.
- Choice cards should have a distinct selected state using more than color alone, such as a border change and a check or other clear indicator.
- Hover, focus, pressed, disabled, loading, and error states should be deliberate and consistent.
- Use the existing visible keyboard-focus approach as a baseline and retain accessible contrast and semantic controls as the design evolves.

Exact component styling and behavior belong to the UI primitive and accessibility tasks.

## Motion and reveal

Motion should help explain a state change: moving between questions, confirming a selection, indicating analysis, or revealing a personality result. Keep transitions brief and composed. Avoid constant pulsing, parallax, looping decoration, or motion that delays the user's next action. Respect reduced-motion preferences.

The analysis moment may create anticipation, but it must stay honest and useful: communicate that the profile is being prepared without implying hidden capabilities or displaying fake technical activity. Detailed timing and easing belong to the motion task.

## Experience-wide hierarchy

Across every screen, prioritize information in this order:

1. The user's current context or result.
2. The next useful action.
3. Supporting explanation and metadata.
4. Decorative atmosphere.

The landing experience introduces the promise; the interview keeps attention on one question; analysis gives a brief sense of transition; results make the personality title and description memorable; recommendations make their personal-fit reasons easy to find; the share card preserves the personality identity in a compact format.

## Reusable design principles

- **Expressive, not noisy:** use a few strong visual moments rather than decoration everywhere.
- **Personal, not generic:** give the user's taste and explanation more prominence than generic AI claims.
- **Consistent, not repetitive:** reuse color roles, type hierarchy, and interaction behavior while adapting layout to each content type.
- **Accessible by default:** preserve readable contrast, keyboard operation, visible focus, semantic structure, usable touch targets, and reduced-motion support.
- **Responsive by composition:** redesign the hierarchy for available space instead of merely scaling desktop layouts down.
- **Truthful feedback:** loading, selection, errors, and recommendation metadata must reflect real application state.

## Decisions reserved for later Phase 3 tasks

This brief locks the art direction and visual principles. It does not select exact font files, define numeric type or spacing scales, set final color values, implement tokens, build components, define animation constants, or create product screens. Those are subsequent Phase 3 tasks. The landing page remains Phase 4.
