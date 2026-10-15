# MediaPulse — Typography System

**Status:** Defined for Phase 3, Task 3.2

## Font roles

- **System sans-serif** (`system-ui`, then `Segoe UI`) is the practical interface voice: body copy, controls, labels, metadata, and utility text. It keeps the interface modern and readable without requiring a downloaded font.
- **System editorial serif** (`Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, then `Georgia`) is the display voice: primary page titles, section headings, and the movie-personality title. Use it selectively so its contrast feels special and remains easy to read.
- **System monospace** (`Cascadia Code`, `SFMono-Regular`, then `Consolas`) is reserved for short technical values; it is not a general-purpose brand or body font.

All three roles use system font stacks, so production builds do not need to fetch font files from an external service.

## Hierarchy

| Role | Approximate size | Line height | Use |
| --- | --- | --- | --- |
| Display | `clamp(3.25rem, 8vw, 6.5rem)` | 0.98 | One defining statement or reveal on a screen |
| H1 | `clamp(2.75rem, 6vw, 4.75rem)` | 1.12 | Main page or result title |
| H2 | `clamp(2rem, 4vw, 3rem)` | 1.12 | Major section heading |
| H3 | `clamp(1.375rem, 2.5vw, 1.75rem)` | 1.12 | Card or subsection heading |
| Body | `1rem` | 1.65 | Paragraphs, explanations, and recommendation reasons |
| Small | `0.875rem` | 1.5 | Supporting metadata and secondary copy |
| Label | `0.75rem` | 1.4 | Short uppercase utility labels |

The CSS variables are a starting scale for the responsive product, not a mandate to use every level on every screen. Use semantic headings in order and keep one clear primary heading per page.

## Usage principles

- Use the system sans stack for long-form reading and interactive UI; reserve the system serif stack for short editorial moments.
- Keep body copy at a comfortable reading size and line length. Do not use the display face for paragraphs, buttons, or dense movie metadata.
- Use balanced wrapping and tight display leading for large titles; retain generous body leading for readability.
- Use uppercase, letter-spaced labels sparingly and only for short utility text.
- Avoid typography that relies on extremely thin weights, tiny text, or all-caps paragraphs to create atmosphere.
- On small screens, allow display and heading sizes to scale fluidly while preserving readable body text.

## Implementation

The font stacks and base type roles are defined in `app/globals.css`, which is imported by `app/layout.tsx`. `.type-display`, `.type-small`, and `.type-label` provide explicit utility roles; semantic `h1`–`h3` use the display family and responsive heading scale.

Color, spacing, component-specific typography, and layout remain in their later Phase 3 tasks.
