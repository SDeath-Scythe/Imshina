# Stamp lettering font

The place name written across each passport stamp uses **Symphonie Calligraphy** by Krismagraph.

The font file is **not in this repository**, on purpose. The free demo is licensed for personal use only and may not be published or redistributed, and this repo is public.

## Using it

- **Locally (personal use):** put `SymphonieCalligraphyDEMO-Regular.otf` in this folder. The app picks it up from `/fonts/SymphonieCalligraphyDEMO-Regular.otf`. The `.gitignore` keeps it out of commits.
- **For a public or commercial launch:** buy a commercial licence from https://circlefont.com/product/symphonie-modern-calligraphy/, put the licensed file here, and update the `src` in the `@font-face` rule at the top of the notebook styles in `src/index.css` if the file name differs. Then decide whether the licence lets you commit it.

Without the file, stamps fall back to **Great Vibes** (Google Fonts, open licence). Arabic names always use **Aref Ruqaa**, because Symphonie has no Arabic letters.
