---
name: dataviz
description: Use before creating or redesigning ANY chart, graph, stat tile, KPI row, meter or dashboard section (e.g. the manager Reports page). Gives a design-system-agnostic procedure - pick the form, assign color by job, validate the palette, apply mark specs, add hover/keyboard layer, accessibility pass - plus an anti-pattern checklist.
---

# Data Visualization

A chart is **read by people and executed by you**. This skill turns "make it look
good" into a procedure with checks, so the result is right by construction rather
than by taste.

**The method is design-system-agnostic.** A design system supplies parameters (ramps,
categorical order, diverging pair, status palette, surfaces, filter components); the
method consumes them unchanged. `references/palette.md` is the reference instance.
In this project, map those parameters to the tokens in `Frontend/src/styles/tokens.css`
(`--primary`, `--success`, `--warning`, `--danger`, `--surface`, `--border`, `--text-muted`)
and keep light/dark both working (`[data-theme='dark']`).

> The single most important habit: **the color part is computable, so compute it.**
> Never eyeball whether a palette is colorblind-safe - run `scripts/validate_palette.js`.

## The procedure - do these in order

Color comes LAST. Most bad charts pick colors first.

1. **Pick the form.** What is the data's job - magnitude, identity, polarity, a single
   headline, change-over-time? Sometimes the answer is *not a chart* (stat tile, hero
   number). -> `references/choosing-a-form.md`
2. **Assign color by the job it does.** Categorical (identity), sequential (magnitude),
   diverging (polarity), or status (state). Categorical hues in fixed order, never cycled.
   -> `references/color-formula.md`
3. **Validate the palette - run the script.**
   `node scripts/validate_palette.js "<hex,hex,...>" --mode light`, then `--mode dark`.
   Fix anything that FAILs.
4. **Apply mark specs & spacers.** Bars <= 24px thick with 4px rounded data-end, square at
   the baseline; 2px lines; >= 8px markers; 2px surface gap between touching fills; hairline
   solid gridlines; selective direct labels. -> `references/marks-and-anatomy.md`
5. **Add the hover layer by default.** Crosshair + tooltip on line/area; per-mark tooltip on
   bars; same on keyboard focus; hit targets bigger than marks; filters in one row above the
   charts. -> `references/interaction.md`
6. **Accessibility pass.** >= 2 series -> legend (and direct labels for <= 4); a table view
   exists; dark mode is selected deliberately and validated; never color alone.
7. **Render it and look at it** - label collisions, geometry, overflow, phone width.

Then check the result against **`references/anti-patterns.md`**.

## Non-negotiables

- Categorical hues in fixed order, never cycled; a 9th series folds into "Other".
- **One axis.** Never a dual-axis chart.
- Color follows the entity, never its rank.
- Sequential = one hue light->dark. Diverging = two hues + neutral gray midpoint.
- Thin marks; legend for >= 2 series (none for one); recessive grid/axes; no number on every point.
- Text wears text tokens, never the series color.
- Status colors (good/warning/serious/critical) are reserved, and ship with icon + label.
- A time axis must be continuous: missing dates are zero (or explicitly gaps), never silently dropped.
- Never stretch an SVG with `preserveAspectRatio="none"`; measure the container width instead.

## Reference files

| File | What it answers |
|------|-----------------|
| `references/choosing-a-form.md` | Which chart type / is it even a chart? |
| `references/color-formula.md` | The four jobs, the six checks, snap-to-passing |
| `references/marks-and-anatomy.md` | Mark specs, spacers, labels, figures, hero number |
| `references/interaction.md` | Tooltips & hover, filters & time ranges |
| `references/components.md` | The pieces a chart is made of |
| `references/anti-patterns.md` | What goes wrong - check every chart against this |
| `references/palette.md` | Reference palette instance |
| `scripts/validate_palette.js` | Runnable palette validator |
