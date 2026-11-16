# FASTRIFA — Design System (Oratry Visual Direction)

## 1. Aesthetic Direction & Point of View
- **Visual World:** Luminous Editorial Tech / Translucent Cobalt Glassmorphism (inspired directly by `https://www.oratry.com.br/`).
- **Anti-Reference:** Dark-mode `#020617` (`slate-950`) + neon emerald `#10b981` ("AI slop" raffle templates).
- **Core Feeling:** Crisp, luminous, trustworthy, editorial, high-contrast light mode where pure white `#FFFFFF` meets atmospheric cobalt radial glows (`#E1EDFF` to `#F5F9FF`) and deep navy ink (`#0D1729`).

## 2. Color Tokens & Contrast (WCAG 2.2 AA/AAA)
- **Canvas Background:** `#FFFFFF`
- **Soft Surface / Stage:** `#F5F9FF` (`rgb(245, 249, 255)`)
- **Atmospheric Glows:** `#E1EDFF`, `#EDF5FF`
- **Primary Ink (Headings & Main Copy):** `#0D1729` (17.8:1 on `#FFFFFF`)
- **Secondary Ink (Body & Subtitles):** `#475872` (7.2:1 on `#FFFFFF`, 6.7:1 on `#F5F9FF` — blue-tinted, never neutral gray)
- **Supporting Ink (Captions & Metadata):** `#526480` (5.9:1 on `#FFFFFF`)
- **Brand Cobalt Blue:** `#0869F5` (Primary Accent)
- **Deep Cobalt (Interactive & Text on Soft Blue):** `#0755DE` / `#052498`
- **Borders:** `#E0E9F7` (Default card), `#D9E5F7` (Interactive control), `#CDE0FC` (Soft blue accent border)

## 3. Typography
- **Display & UI Voice:** `Satoshi` (weights 500, 700, 900), tight negative letter-spacing (`-0.04em`), line-height `1.06–1.12`.
- **Body & Functional Copy:** `Inter`, line-height `1.55–1.65`, measure `60–72ch`.
- **Numeric Data:** `font-variant-numeric: tabular-nums` across all ticket numbers, prices, and revenue counters.

## 4. Layout, Radii & Elevation
- **Navigation:** Floating glass pills (`border-radius: 999px`, `rgba(255, 255, 255, 0.90)`, `backdrop-filter: blur(14px)`, border `#E3EDFB`).
- **Cards & Stages:** `24px` to `32px` border-radius with soft cobalt-tinted refraction shadows (`0 14px 40px rgba(32, 75, 134, 0.06)`).
- **Buttons:** `999px` pill or `18px` rounded-rect with `linear-gradient(145deg, #529BFF 0%, #0874FA 55%, #0855DF 100%)` and `0 12px 30px rgba(8, 105, 245, 0.18)`.
