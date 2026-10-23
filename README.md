# STARK Quartz Kitchen Sink — Marketing Website

Static single-page website for **STARK** (“Kitchen Royalty”). No build step required.

4. **Added Varmora-Style Sticky Stacking Cards Scroll Animation (`#collections` in `index.html`, `styles.css`, `app.js`)**:

   * Converted the 4 Collection Format Cards (*01 Single Bowl*, *02 Double Bowl*, *03 Workstation*, and *04 Ultra Wide*) into full-width rounded **Sticky Stacking Cards** (`.collection-grid.sticky-stack-deck` and `.collection-card.stack-card`).

   * Styled the 4 cards in contrasting STARK architectural palettes (Royal Oxblood, Warm Quartz Ivory, Charcoal Espresso, and Royal Crimson) with incremental `position: sticky` top offsets (`--stack-step: 28px`) so each card's numbered top bar peeks out when subsequent cards slide up over it.

   * Added `initStickyStack()` in `app.js` to smoothly scale down (`--stack-scale`) and shade (`--stack-bright`) underlying cards in real time as the next card scrolls up over them, plus quick-filter `"Explore ... →"` jump buttons that scroll directly to the matching models in `#products`.

5. **Added Varmora-Style 3D Rotating Dotted Globe & Updated Why STARK / Contacts (`index.html`, `styles.css`, `app.js`)**:

   * Built an interactive **3D Rotating Halftone Dot-Matrix Globe** (`<canvas id="exportGlobe">`) inside an overlapping **Circular Halo Pedestal** in the `#export` (*Global Footprint*) section, complete with Fresnel rim lighting, a pulsing **Morbi, Gujarat** origin beacon, live 3D export arcs, continuous 60fps rotation, and pointer drag inertia.

   * Updated the first feature card in `#features` (*Why STARK*) from `Acid proof` to `No Acid Proof` (advising mild soap and water cleaning and avoiding harsh acid cleaners) and removed Rudra Patel's name and phone number (`+91 84878 42135`) from the Contact section and Footer.

## Run locally

Open `index.html` in a browser, or serve from this folder:

```
npx --yes serve .


```

Then visit `http://localhost:3000`.

## Logos & Preloader Animation

Both official transparent golden logos are stored in `assets/`:

* `assets/ICON_Logo_Transfferent_Golden.png` — STARK faucet-S crest icon (used in the preloader stage-1 halo reveal and browser favicon)

* `assets/Stark_Logo_Transfferent_Golden.png` — STARK full horizontal logo with “KITCHEN ROYALTY” (used in the preloader stage-2 gold-sweep reveal, header, and footer)

## How to Add Product, Finish & Collection Images & Videos (Blank Shapes)

Every blank image and video shape uses `.media-slot` (`.photo-slot` or `.video-slot`).

* **While `src=""` is empty** (or before the file is placed in `assets/`), the website automatically displays a styled architectural placeholder card with the item name and path hint.

* **As soon as you add a valid file path inside `src="..."`**, the placeholder automatically disappears and your photo or video fills the frame with smooth hover/playback interactions.

### 0. Original Manufacturing Plant Photo (`#about` — `assets/plant/`)
Search for `PASTE PLANT IMAGE` in `index.html` and add your factory/plant photo path:
- **Morbi Manufacturing Plant** — `src="assets/plant/morbi-plant.jpg"`

### 1. Two General Videos (`assets/videos/`)

Search for `PASTE VIDEO` in `index.html` and add your video paths:

* **General Video 01 (About / Morbi Manufacturing Film)**:

  ```
  <video src="assets/videos/morbi-manufacturing.mp4" poster="" autoplay muted loop playsinline controls preload="auto"></video>
  
  
  ```

* **General Video 02 (Why Stark / Durability & Workstation Demo)**:

  ```
  <video src="assets/videos/product-showcase.mp4" poster="" autoplay muted loop playsinline controls preload="auto"></video>
  
  
  ```

### 2. Four Collection Format Cards (`assets/collections/`)

Search for `PASTE COLLECTION` in `index.html`:

* `assets/collections/single-bowl.jpg`

* `assets/collections/double-bowl.jpg`

* `assets/collections/workstation.jpg`

* `assets/collections/ultra-wide.jpg`

### 3. All 18 Individual Product Models (`assets/products/`)

Search for `PASTE PRODUCT` in `index.html`:

 1. **Model 01 — Single Bowl Sink 18×16 (8.5" Depth)** — `src="assets/products/model-01-single-bowl-18x16-8.5in.jpg"`

 2. **Model 02 — Single Bowl Sink 18×16 (9.5" Depth)** — `src="assets/products/model-02-single-bowl-18x16-9.5in.jpg"`

 3. **Model 03 — Single Bowl Sink 18×21 (8.5" Depth)** — `src="assets/products/model-03-single-bowl-18x21-8.5in.jpg"`

 4. **Model 04 — Single Bowl Sink 18×21 (9.5" Depth)** — `src="assets/products/model-04-single-bowl-18x21-9.5in.jpg"`

 5. **Model 05 — Single Bowl Sink 18×24 (8.5" Depth)** — `src="assets/products/model-05-single-bowl-18x24-8.5in.jpg"`

 6. **Model 06 — Single Bowl Sink 18×24 (9.5" Depth)** — `src="assets/products/model-06-single-bowl-18x24-9.5in.jpg"`

 7. **Model 07 — Single Bowl Sink (Deep) 18×24 (10" Depth)** — `src="assets/products/model-07-single-bowl-deep-18x24-10in.jpg"`

 8. **Model 08 — Single Bowl Sink 24×20 (8.5" Depth)** — `src="assets/products/model-08-single-bowl-24x20-8.5in.jpg"`

 9. **Model 09 — Single Bowl Sink (Chamfered Corners) 18×24 (9.5" Depth)** — `src="assets/products/model-09-single-bowl-chamfered-18x24.jpg"`

10. **Model 10 — Multi Functional Single Bowl Sink 18×24 (9.5" Depth)** — `src="assets/products/model-10-multi-functional-18x24.jpg"`

11. **Model 11 — All In One Multi Functional Single Bowl Sink 30×20 (9.5" Depth)** — `src="assets/products/model-11-all-in-one-workstation-30x20.jpg"`

12. **Model 12 — Single Bowl With Tap Hole (Step Ledge, 2 Tap Holes) 20×30 (9.5" Depth)** — `src="assets/products/model-12-single-bowl-step-ledge-20x30.jpg"`

13. **Model 13 — Single Bowl With Tap Hole (Flat Back Ledge) 20×30 (9.5" Depth)** — `src="assets/products/model-13-single-bowl-flat-ledge-20x30.jpg"`

14. **Model 14 — Single Bowl Sink 19×31 (9.5" Depth)** — `src="assets/products/model-14-single-bowl-19x31.jpg"`

15. **Model 15 — Ultra Wide Single Bowl Sink (With Drainboard) 18×36 (9.5" Depth)** — `src="assets/products/model-15-ultra-wide-drainboard-18x36.jpg"`

16. **Model 16 — Classic Double Bowl Sink 18×37 (9.5" Depth)** — `src="assets/products/model-16-classic-double-bowl-18x37.jpg"`

17. **Model 17 — Double Bowl Sink 20×40 (9.5" Depth)** — `src="assets/products/model-17-double-bowl-20x40.jpg"`

18. **Model 18 — Ultra Wide Double Bowl Sink 20×45 (9.5" Depth)** — `src="assets/products/model-18-ultra-wide-double-20x45.jpg"`

### 4. Seven Original Colour Sink Image Slots (`#finishes` — `assets/finishes/`)

Search for `PASTE FINISH` in `index.html` and add your original coloured sink photo paths:

* **Metallic Family (3)**:

  1. **Smoky Lack** — `src="assets/finishes/smoky-lack-sink.jpg"`

  2. **Ultra Gray** — `src="assets/finishes/ultra-gray-sink.jpg"`

  3. **Dark Brown** — `src="assets/finishes/dark-brown-sink.jpg"`

* **Granite Family (4)**:
  4. **Cera Doted** — `src="assets/finishes/cera-doted-sink.jpg"`
  5. **Rustic White** — `src="assets/finishes/rustic-white-sink.jpg"`
  6. **Mars** — `src="assets/finishes/mars-sink.jpg"`
  7. **Cool Ivory** — `src="assets/finishes/cool-ivory-sink.jpg"`

### 5. 3D Floating Packshot / Out-of-Bounds Effect (`.packshot-3d`)

All **29 image slots** (4 Collection cards, 18 Product models, and 7 Finish sink slots) include the `.packshot-3d` class:

* **For the best "Balaji Wafers" 3D pop-out look**: Use **transparent-background `.png` or `.webp` cutout images** of your sinks. CSS `filter: drop-shadow(...)` automatically traces the exact contour of the sink and faucet, lifts the sink out of its box (`overflow: visible`), animates a gentle 3D levitation, and projects a soft blurred elliptical contact shadow on the floor underneath.

* **On mouse hover**: The card tilts in 3D perspective (`rotateX`/`rotateY`) while the sink pops forward off the card (`translateZ(42px) scale(1.11) rotate(-1.5deg)`) and the floor shadow contracts underneath.

* **If using rectangular background photos (`.jpg`)**: They also float and cast a 3D shadow; if you want any specific slot to crop edge-to-edge instead of `contain`, add `data-fit="cover"` to that `.media-slot` div.