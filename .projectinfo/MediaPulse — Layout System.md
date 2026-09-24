# MediaPulse — Layout System

**Status:** Defined for Phase 3, Task 3.4

## Containers

| Container | Maximum outer width | Use |
| --- | ---: | --- |
| Page | `80rem` | Full page composition and wide feature sections |
| Content | `72rem` | Standard text-plus-media sections and movie collections |
| Interview | `56rem` | Focused adaptive interview experience |
| Reading | `44rem` | Long descriptions and comfortable reading measure |

All containers are fluid below their maximum and use a responsive horizontal gutter of `clamp(1.25rem, 4vw, 3rem)`. Their maximum widths include the gutters because global box sizing is border-box.

## Spacing scale

Use the following base rhythm for component gaps and padding:

```text
space-1  0.5rem
space-2  0.75rem
space-3  1rem
space-4  1.5rem
space-5  2rem
space-6  3rem
space-7  4rem
space-8  6rem
```

Standard section spacing is `clamp(4rem, 8vw, 7rem)` vertically. Compact sections use `clamp(2.5rem, 5vw, 4rem)`. Use larger values to separate product stages and smaller values for related controls and metadata.

## Grid and responsive behavior

- Default to a single column on narrow viewports.
- Use a fluid grid with a minimum card width of `17rem` and a responsive gap of `clamp(1rem, 2.5vw, 2rem)`. Cards wrap into as many columns as the available content width supports.
- Keep reading content and the adaptive interview narrower than the full page. Reserve the wider content container for movie collections and sections where imagery benefits from room.
- At small widths, preserve the same content order and allow grids to wrap; do not introduce horizontal scrolling for primary content.
- On wider screens, use available space for composition and additional columns rather than stretching paragraphs or interview questions.

## Implementation

The layout tokens, Tailwind container aliases, and reusable `.page-container`, `.content-container`, `.reading-container`, `.interview-container`, `.page-section`, `.page-section--compact`, and `.layout-grid` classes are in `app/globals.css`. This task defines the primitives' layout contract; the reusable React `Container` component remains part of Task 3.5.
