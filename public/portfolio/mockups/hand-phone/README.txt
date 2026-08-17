Hand Phone Mockup — asset guide

Place these files in this folder:

  phone mockup for scroll.png
    hand-phone mockup texture (PNG, transparent background).
    Screen area should be transparent so the long image shows through; hand, bezel, and shadow stay on the texture.

  frame new.png
    screen mask (PNG, black and white).
    White = visible, black = clipped. Used for precise non-rectangular screen fit.

  mockup.png (optional)
    full reference for aligning screen inset; not rendered on the page.

Screen inset (long image display area) is adjusted via constants at the top of src/components/HandPhoneMockup.tsx:
  SCREEN_INSET = { top, right, bottom, left }  // percentages

Bump MOCKUP_REV in HandPhoneMockup.tsx after replacing the mockup to refresh cache.
