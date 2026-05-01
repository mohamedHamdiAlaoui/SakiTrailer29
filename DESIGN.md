---
name: "SAKI TRAILER 29"
description: "Official Lecitrailer Morocco showroom and fleet stock platform."
colors:
  brand-blue: "#0047AB"
  brand-blue-light: "#0066CC"
  brand-red: "#E31E24"
  brand-gold: "#FFD700"
  brand-gold-light: "#FFE44D"
  surface-page: "#F8FAFC"
  surface-muted: "#F1F5F9"
  surface-card: "#FFFFFF"
  text-strong: "#020617"
  text-muted: "#475569"
  border-soft: "#E2E8F0"
  status-available: "#10B981"
  status-reserved: "#F59E0B"
  status-sold: "#334155"
typography:
  display:
    fontFamily: "Teko, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Teko, sans-serif"
    fontSize: "clamp(2rem, 3vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Teko, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-accent:
    backgroundColor: "{colors.brand-gold}"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  product-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: SAKI TRAILER 29

## 1. Overview

**Creative North Star: "The Working Showroom"**

This system should feel like a serious commercial vehicle showroom built for operators, not a decorative brochure. The public site can be bold and brand-forward, especially in the hero and service areas, but every visual choice must lead back to inventory clarity, Lecitrailer authority, and fast contact.

The default register is brand: the main surface sells trust, availability, and official representation. The admin and dashboard areas are product surfaces inside the same identity, so they should become calmer, denser, and more utilitarian while still using the blue, gold, typography, and status language consistently.

The design explicitly rejects a generic automotive marketplace, luxury lifestyle car styling, overanimated SaaS dashboard mood, and thin brochure-site behavior. Product imagery, categories, specs, showroom locations, and lead actions are the proof.

**Key Characteristics:**
- Official Lecitrailer blue anchors navigation, hero overlays, primary buttons, and category cues.
- Gold is the high-confidence action accent for hero CTAs, selected service states, and showroom highlights.
- Product photography is the main visual asset. It should stay large, sharp, and inspectable.
- Cards exist for stock items, forms, dashboards, and repeated records, not as a default page-section wrapper.
- Multilingual layout resilience matters as much as visual polish.

## 2. Colors

The palette is committed but functional: blue carries the business identity, gold marks commercial action and importance, red stays rare, and slate neutrals keep inventory pages readable.

### Primary
- **Official Lecitrailer Blue** (`brand-blue`): Use for the fixed header, primary CTAs, section eyebrows, filter icons, focus cues, and trusted authority moments.
- **Working Blue Light** (`brand-blue-light`): Use for hover states and subtle blue range expansion only. It should not become a second dominant brand color.

### Secondary
- **Showroom Gold** (`brand-gold`): Use for the highest-value CTA in brand moments, selected service tabs, hero emphasis, star ratings, and contact highlights.
- **Gold Light** (`brand-gold-light`): Use only as a hover state or soft emphasis near the gold token.

### Tertiary
- **Action Red** (`brand-red`): Use sparingly for brand contrast, destructive attention, or rare emphasis. It should never compete with product status colors.

### Neutral
- **Page Slate** (`surface-page`): Use for stock, dashboard, admin, and detail page backgrounds where scanning matters.
- **Muted Slate Surface** (`surface-muted`): Use for specification blocks, filter backgrounds, and low-emphasis data zones.
- **Card Surface** (`surface-card`): Use for product cards, forms, admin cards, and dialogs.
- **Strong Text** (`text-strong`): Use for titles, product names, prices, and primary data.
- **Muted Text** (`text-muted`): Use for supporting copy, descriptions, metadata, and helper text.
- **Soft Border** (`border-soft`): Use for dividers, inputs, table rows, and quiet card separation.

### Named Rules

**The Authority Blue Rule.** Blue should tell the user where the business stands: official, stable, and ready to act. Do not replace it with generic navy, purple, or black.

**The Gold Means Action Rule.** Gold must remain scarce enough to matter. Use it for primary brand CTAs and selected states, not as general decoration.

**The Status Is Operational Rule.** Available, reserved, and sold colors communicate real stock state. Pair them with text labels and never rely on color alone.

## 3. Typography

**Display Font:** Teko with sans-serif fallback  
**Body Font:** Poppins with sans-serif fallback  
**Label/Mono Font:** Poppins with sans-serif fallback

**Character:** Teko gives the site an industrial, transport-adjacent voice without becoming novelty type. Poppins keeps forms, filters, product descriptions, and admin data legible.

### Hierarchy
- **Display** (600, `clamp(2.5rem, 5vw, 4.5rem)`, 1.05): Hero headlines and first-screen brand statements only.
- **Headline** (600, `clamp(2rem, 3vw, 3.75rem)`, 1.1): Section titles, showroom calls, and major catalog headings.
- **Title** (600, `1.5rem`, 1.2): Product names, card titles, dialogs, admin panels, and detail subsections.
- **Body** (400, `1rem`, 1.6): Descriptions, form copy, product details, and general reading. Cap long prose at 65 to 75 characters.
- **Label** (600, `0.75rem`, `0.2em`, uppercase): Eyebrows, category labels, metadata labels, and compact UI captions.

### Named Rules

**The Showroom Voice Rule.** Use Teko for confident public headings. Use Poppins when the user is reading, filtering, entering data, or comparing specs.

**The No Tiny Authority Rule.** The Lecitrailer Morocco message must never be buried in small eyebrow text alone. It needs real headline presence on brand surfaces.

## 4. Elevation

The system uses a hybrid of flat utility surfaces and responsive lift. Stock and admin screens should be mostly flat at rest, with shadows reserved for hover, dialogs, cards that must separate from dense data, and media-rich product objects.

### Shadow Vocabulary
- **Utility Rest** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Quiet UI components such as filters, inputs, and low-emphasis cards.
- **Card Rest** (`0 4px 20px rgba(0,0,0,0.1)`): Public testimonial and product surfaces that need a little showroom tactility.
- **Card Hover** (`0 20px 60px rgba(0,0,0,0.2)`): Use only when a card also moves or scales as an interactive object.
- **Dialog Lift** (`0 25px 50px -12px rgb(0 0 0 / 0.25)`): Large admin dialogs and overlays.

### Named Rules

**The Lift On Intent Rule.** Shadows should answer user intent: hover, active state, modal focus, or visual separation. Static pages should not become a stack of floating panels.

## 5. Components

### Buttons

- **Shape:** Gently rounded rectangles using the standard radius (`8px`).
- **Primary:** Official Lecitrailer Blue background with white text, medium weight, and compact but confident horizontal padding.
- **Accent:** Showroom Gold background with blue text for hero CTAs and selected brand actions.
- **Hover / Focus:** Darken or lighten within the same token family. Preserve the visible focus outline from `App.css`.
- **Secondary / Ghost:** Use transparent or white backgrounds with blue text or borders. Keep them clearly secondary to primary and gold actions.

### Chips

- **Style:** Rounded badges with solid stock-status colors or white-on-image brand/category chips.
- **State:** Product status chips must always include text. Filter chips and active nav states may use blue or gold but should not look like status indicators.

### Cards / Containers

- **Corner Style:** Product cards use larger rounded corners (`16px`), while page-level admin cards often use `24px`.
- **Background:** White card surfaces over slate page backgrounds.
- **Shadow Strategy:** Use utility rest at default and stronger lift only for interactive public cards or dialogs.
- **Border:** Use soft slate borders for filter panels, detail tables, product cards, and admin tables.
- **Internal Padding:** Use `20px` for product cards, `24px` for standard panels, and `32px` for hero-adjacent or modal content.

### Inputs / Fields

- **Style:** White fields with soft slate borders and `8px` radius.
- **Focus:** Keep a gold visible outline or a blue focus ring. Never remove focus visibility.
- **Error / Disabled:** Use red for validation, muted slate for disabled fields, and clear helper text next to the control.

### Navigation

The header is fixed, blue, and business-first. Desktop navigation uses white text, gold active states, and compact language controls. Mobile navigation should preserve the same hierarchy without squeezing translated labels. Dropdowns use white surfaces, slate text, and blue active states.

### Product Listing

Product cards are the signature repeated object. Each card needs a strong vehicle image, visible status, brand, category, title, compact specs, and one clear detail action. New Lecitrailer stock can use "Price on request"; used stock should show currency prominently.

### Showroom Visit

The showroom section can use image-backed depth and a controlled translucent panel because it sits on real place imagery. Do not generalize this treatment into glassmorphism elsewhere.

## 6. Do's and Don'ts

### Do:

- **Do** keep the official Lecitrailer Morocco role visible in first-screen and service contexts.
- **Do** make product imagery large enough to inspect and crop it around the actual vehicle, not abstract atmosphere.
- **Do** preserve fast comparison in stock grids: status, brand, category, year, mileage, location, and action.
- **Do** test French, English, and Spanish strings before shipping compact cards, buttons, nav, filters, and dialogs.
- **Do** use cards for repeated inventory, forms, dashboards, and dialogs where the affordance is real.
- **Do** keep admin and dashboard screens calmer and denser than the public landing surfaces.

### Don't:

- **Don't** make this feel like a generic automotive marketplace that hides the dealership authority behind endless undifferentiated cards.
- **Don't** make it feel like a luxury lifestyle car site disconnected from heavy transport work.
- **Don't** drift into overanimated SaaS dashboard styling with abstract gradients, dark-purple tech mood, decorative glass, or hard-to-scan listings.
- **Don't** reduce it to a thin brochure site that fails to expose inventory, product detail, contact paths, and showroom visit actions.
- **Don't** use gradient text, decorative glassmorphism, or side-stripe accent borders as default styling patterns.
- **Don't** create nested cards or wrap whole page sections in floating cards.
- **Don't** let color alone communicate status, validation, selection, or destructive actions.
