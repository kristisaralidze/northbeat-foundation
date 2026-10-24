# Home page experience pass

Only the ten listed changes. Colours, fonts, the written wordmark animation, ecosystem look and the flat end state of the heartbeat stay as they are.

## Copy rule note
Your saved rules say that inside the heartbeat, copy rules still apply: no all-caps labels and no middle dots. So the top line will read "Coming up in Nordic health, 18 Nov" and the card label will be "Next up" in normal case. Tell me if you want the brief's exact versions instead.

## Changes
1. **Hero background**: remove the fabric image and use plain #F7F5F0 so it blends into the next section. Update the saved fabric rule (it will stay only in the footer band and the Learn circle).
2. **Wordmark glide**: as you scroll from 0 to (hero height minus navbar height), the big wordmark moves and shrinks to the exact spot and size of the navbar logo. It uses only translate and scale, updated once per frame. The tagline fades out over the first 40%. Once it lands, the navbar logo appears in the same place, so there is no jump. Scrolling up reverses it. Phones work the same way. With reduced motion there is no glide and the navbar logo just appears.
3. **What is happening**: a small line at the top left reads "Coming up in Nordic health, [date]". The big date at the bottom left and the caption after a beat both go. A "Next up" card sits at the bottom centre. It shows the logo (or the organiser's name), the title (or "[first] + n more"), the date, and "Today", "Tomorrow" or "In n days". Deadlines show "Deadline in n days" in the accent colour. It cross-fades when a beat passes. Tapping it opens the item, or a list if there are several. It hides during the unroll.
4. **Scroll by event**: the scroll is split into equal stops: the start, one per beat (resting at day minus 0.8), then the end. The line eases between stops with smoothstep. Section height is 100vh plus 70vh per beat, kept between 300vh and 650vh. The soft glide (dt * 3.5) stays.
5. **Heights mean something**: rest 0.5, one event 3.0, one deadline 4.0, two items 4.5, three or more 5.5. One scale factor keeps the tallest spike at its stop under 40% of the screen height.
6. **Phones**: the line runs from the bottom centre (CX 0.5W, camX -0.6). The logo on the nearest spike is at least 22px radius on phones and 28px on desktop, with date and title above it. Only the nearest beat gets a label.
7. **Event logos**: organiser logo first, then the Brandfetch icon for the event's own website domain. If both fail, there is no circle on the spike and the card shows the name as text.
8. **Ecosystem hover**: remove the definitions card and the sentence pills on the lines. Keep the highlight and the click through to Explore.
9. **Smoothness**: normal scrolling, no canvas shadows or blur, animations pause when off screen.
10. **Check**: Playwright at 390px and 1440px. The wordmark lands on the navbar logo within 1px, no spike leaves the screen, the card never covers a logo or the nearest spike, and nothing overlaps.

## Technical details
- `src/lib/heartbeat.ts`: replace `warpedDay` with pure `buildStops(beats, idle, end)` and `dayAtProgress(p, stops)` (smoothstep per segment), `beatHeight(items)` and `heightScale(maxH, H, camera)`, `sectionHeightVh(n)`. Add tests asserting 0.5/3/4/4.5/5.5, the 300–650 clamp, stop at d-0.8 and equal stop shares.
- `HeartbeatHero.tsx`: drop the caption and the bottom-left date. Add the top-line and Next up card as DOM refs updated in the frame loop (opacity cross-fade on key change), plus a phone camera constant and a label pass limited to the nearest beat. Set the section height from the beat count.
- `src/routes/index.tsx` and the site header: a rAF scroll handler measures the navbar logo rect and the hero wordmark rect once on resize, then sets the transform on the hero wordmark. The navbar logo's opacity switches at progress 1. A reduced-motion branch skips the glide.
- `LivingCells.tsx` / `living-cells-canvas.ts`: remove the definitions/sentences list and the pill drawing pass.
- Update memory: the atmospheric-image and home-layout notes.
