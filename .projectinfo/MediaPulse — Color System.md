# MediaPulse — Color System

**Status:** Defined for Phase 3, Task 3.3

## Palette

| Role | Value | Purpose |
| --- | --- | --- |
| Background | `#0b0b0f` | Main page canvas; deep ink, not pure black |
| Foreground | `#f5f5f7` | Primary text and high-contrast details |
| Surface | `#121218` | Default card and panel surface |
| Elevated surface | `#19191f` | Emphasized or layered surface |
| Muted surface | `#202027` | Quiet inset or selected neutral surface |
| Border | `#30303a` | Subtle separation between surfaces |
| Strong border | `#454550` | Emphasized boundary and control outline |
| Muted text | `#b0b0ba` | Secondary but comfortable reading text |
| Quiet text | `#898994` | Supporting metadata and low-priority text |
| Accent | `#f2b35b` | Restrained warm amber for primary action and key selection |
| Accent foreground | `#20170a` | Text/icons placed on the accent fill |
| Accent subtle | `#302416` | Low-emphasis accent-tinted selection surface |
| Success | `#4ade80` | Positive status indicator |
| Success foreground | `#052e16` | Text placed on a success fill |
| Error | `#f87171` | Error status indicator |
| Error foreground | `#2b0b0b` | Text placed on an error fill |

The palette keeps the existing near-black cinematic base and changes the formerly neutral primary accent to warm amber, as established in the visual direction. Movie posters and stills remain the main source of saturated imagery.

## Usage rules

- Use the background for the page canvas and surfaces for content layers; do not create depth with heavy shadows everywhere.
- Use foreground for primary reading text. Muted text remains readable; quiet text is for short secondary details, not long paragraphs.
- Reserve the warm accent for the main action, active/selected states, and a small number of intentional highlights. Pair its fill with the dark accent foreground.
- Use the subtle accent surface for selection emphasis when a solid accent fill would be too loud.
- Success and error colors communicate state only. Pair their fills with their corresponding dark foreground tokens when text sits directly on the color.
- Keep borders subordinate to content. Use the stronger border only when a control or selected surface needs more definition.
- Avoid introducing additional brand hues or gradients at component level without a concrete need.

## Contrast check

Relative contrast ratios calculated from the defined hex values:

| Pair | Contrast |
| --- | ---: |
| Foreground on background | 18.04:1 |
| Muted text on background | 9.13:1 |
| Quiet text on background | 5.68:1 |
| Accent on background | 10.64:1 |
| Accent foreground on accent | 9.57:1 |
| Success foreground on success | 8.55:1 |
| Error foreground on error | 6.57:1 |

These checks cover the documented base pairings. Component states still need review against their actual surfaces and interaction states during the accessibility task.

## Implementation

Semantic CSS variables and Tailwind color aliases are defined in `app/globals.css`. Existing `danger` names remain available as aliases for the error role so current UI primitives continue to work while new code can use `error` directly.
