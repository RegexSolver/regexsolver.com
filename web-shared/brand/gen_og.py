"""Generate the social share (Open Graph) images as SVG — see README.md to run.

One 1200x630 card per frontend: the identity's two automaton-state circles as
the figure, the landing page's own H1 ("Set algebra for regex.") as the
headline, and a mono eyebrow naming the site.

Geometry, colours and the font setup mirror gen_logo.py (the lockup generator);
its small font helpers are duplicated rather than shared so that regenerating
the cards can never change brand.ts or the logo SVGs.
"""

import math
import os

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

W, H = 1200, 630

# The identity's light palette (src/index.css :root / gen_logo.py LIGHT).
PAPER = "#FBFAF7"
INK = "#141416"
MUTED = "#6B6960"
SET_A = "#2A3FD4"
SET_B = "#D13E1E"
OVERLAP = "#6E2C6B"


def load(path, axes):
    f = TTFont(path)
    instantiateVariableFont(f, axes, inplace=True)
    return f


# The display face, condensed exactly as the sites set headings
# (font-variation-settings "wdth" 87.5), and the mono face used for small
# letterspaced labels.
DISPLAY = load("martian.ttf", {"wdth": 87.5, "wght": 700})
MONO = load("jetbrains.ttf", {"wght": 500})


def glyphs(font, s, size, tracking):
    """Per-glyph SVG paths on a y-down canvas, laid out from x=0, y=baseline.

    Returns (paths, advance): `paths` is one (char, d) per glyph so a caller can
    colour a single character (the headline's period is set-b), `advance` is the
    total pen movement including tracking between glyphs.
    """
    upm = font["head"].unitsPerEm
    scale = size / upm
    track = tracking * size
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    paths, x = [], 0.0
    for ch in s:
        gname = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        # y-down canvas: the font's y-up outlines are flipped, so the glyph
        # sits above the baseline that the caller translates to.
        gs[gname].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, x, 0)))
        paths.append((ch, pen.getCommands()))
        x += gs[gname].width * scale + track
    return paths, x - track if s else 0.0


def width_of(font, s, size, tracking):
    return glyphs(font, s, size, tracking)[1]


def fit_size(font, lines, tracking, max_width, ceiling):
    """Largest integer size <= ceiling whose widest line fits max_width."""
    size = ceiling
    while size > 8 and max(width_of(font, l, size, tracking) for l in lines) > max_width:
        size -= 1
    return size


def render(font, s, size, tracking, x, baseline, fill, accent=None):
    """A <g> of glyph paths; `accent` colours the final character instead."""
    paths, _ = glyphs(font, s, size, tracking)
    out = []
    for i, (ch, d) in enumerate(paths):
        if not d:
            continue
        colour = accent if accent and i == len(paths) - 1 else fill
        out.append(f'<path d="{d}" fill="{colour}"/>')
    body = "\n    ".join(out)
    return f'  <g transform="translate({x:.1f} {baseline:.1f})">\n    {body}\n  </g>'


# ---- Figure: the two intersecting state circles, right of the text column ----
# Placed for even optical margins: 72px left, ~56px right of the figure, ~62px
# between the headline and the first circle.
FIG_CX, FIG_CY = 906.0, 315.0
FIG_R = 132.0
# Same stroke-to-radius ratio as the lockup (62/416).
FIG_STROKE = round(FIG_R * 62 / 416, 1)
FIG_D = FIG_R * 1.45  # centre distance, as in gen_logo.py
C1X = FIG_CX - FIG_D / 2
C2X = FIG_CX + FIG_D / 2

_half = FIG_D / 2
_h = math.sqrt(FIG_R * FIG_R - _half * _half)
FIG_LENS = (
    f"M {FIG_CX:.1f} {FIG_CY - _h:.1f} "
    f"A {FIG_R:.1f} {FIG_R:.1f} 0 0 1 {FIG_CX:.1f} {FIG_CY + _h:.1f} "
    f"A {FIG_R:.1f} {FIG_R:.1f} 0 0 1 {FIG_CX:.1f} {FIG_CY - _h:.1f} Z"
)
FIGURE = f"""  <path d="{FIG_LENS}" fill="{OVERLAP}"/>
  <circle cx="{C1X:.1f}" cy="{FIG_CY:.1f}" r="{FIG_R:.1f}" fill="none" stroke="{SET_A}" stroke-width="{FIG_STROKE}"/>
  <circle cx="{C2X:.1f}" cy="{FIG_CY:.1f}" r="{FIG_R:.1f}" fill="none" stroke="{SET_B}" stroke-width="{FIG_STROKE}"/>"""

# ---- Text column ----
PAD_X = 72.0
COL_W = C1X - FIG_R - FIG_STROKE / 2 - PAD_X - 48  # keep clear of the figure

LOCKUP_H = 34.0  # same 24px-logo proportions as the site headers, scaled up
LOCKUP_Y = 72.0

EYEBROW_SIZE = 17.0
EYEBROW_TRACK = 0.14  # the site's mono label tracking
EYEBROW_BASELINE = 268.0

HEAD_LINE_1, HEAD_LINE_2 = "Set algebra", "for regex."
HEAD_TRACK = -0.03  # the H1's tracking-[-0.03em]
HEAD_SIZE = fit_size(DISPLAY, [HEAD_LINE_1, HEAD_LINE_2], HEAD_TRACK, COL_W, 78)
HEAD_BASELINE_1 = 356.0
HEAD_LEADING = round(HEAD_SIZE * 1.14, 1)

DOMAIN_SIZE = 18.0
DOMAIN_TRACK = 0.06
DOMAIN_BASELINE = 546.0

# The lockup redrawn here rather than embedded as a second file: mark geometry
# scaled to LOCKUP_H, then the word beside it, at gen_logo.py's proportions.
LOCK_R = LOCKUP_H * 0.5 * 0.86
LOCK_STROKE = round(LOCK_R * 62 / 416, 1)
LOCK_D = LOCK_R * 1.45
LOCK_C1X = PAD_X + LOCK_R + LOCK_STROKE / 2
LOCK_C2X = LOCK_C1X + LOCK_D
LOCK_CY = LOCKUP_Y + LOCKUP_H / 2
_lock_half = LOCK_D / 2
_lock_h = math.sqrt(LOCK_R * LOCK_R - _lock_half * _lock_half)
LOCK_MX = (LOCK_C1X + LOCK_C2X) / 2
LOCK_LENS = (
    f"M {LOCK_MX:.1f} {LOCK_CY - _lock_h:.1f} "
    f"A {LOCK_R:.1f} {LOCK_R:.1f} 0 0 1 {LOCK_MX:.1f} {LOCK_CY + _lock_h:.1f} "
    f"A {LOCK_R:.1f} {LOCK_R:.1f} 0 0 1 {LOCK_MX:.1f} {LOCK_CY - _lock_h:.1f} Z"
)
# Cap height sets the wordmark size so it optically matches the circles.
_disp_cap = DISPLAY["OS/2"].sCapHeight / DISPLAY["head"].unitsPerEm
WORD_SIZE = round(LOCK_R * 2 * 0.86 / _disp_cap, 1)
WORD_X = LOCK_C2X + LOCK_R + WORD_SIZE * 0.30
WORD_BASELINE = LOCK_CY + WORD_SIZE * _disp_cap / 2

LOCKUP = f"""  <path d="{LOCK_LENS}" fill="{OVERLAP}"/>
  <circle cx="{LOCK_C1X:.1f}" cy="{LOCK_CY:.1f}" r="{LOCK_R:.1f}" fill="none" stroke="{SET_A}" stroke-width="{LOCK_STROKE}"/>
  <circle cx="{LOCK_C2X:.1f}" cy="{LOCK_CY:.1f}" r="{LOCK_R:.1f}" fill="none" stroke="{SET_B}" stroke-width="{LOCK_STROKE}"/>
{render(DISPLAY, "regexsolver", WORD_SIZE, -0.02, WORD_X, WORD_BASELINE, INK)}"""

# Eyebrow + domain per app. The eyebrows are the API's own tag vocabulary
# (Analyze/Compute/Generate in shared/openapi.yaml) and the site section names.
VARIANTS = {
    "default": ("ANALYZE · COMPUTE · GENERATE", "regexsolver.com"),
    "docs": ("DOCUMENTATION · API REFERENCE", "docs.regexsolver.com"),
    "console": ("DEVELOPER CONSOLE", "console.regexsolver.com"),
}


def card(eyebrow, domain):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="RegexSolver — set algebra for regex">
  <rect width="{W}" height="{H}" fill="{PAPER}"/>
{FIGURE}
{LOCKUP}
{render(MONO, eyebrow, EYEBROW_SIZE, EYEBROW_TRACK, PAD_X, EYEBROW_BASELINE, MUTED)}
{render(DISPLAY, HEAD_LINE_1, HEAD_SIZE, HEAD_TRACK, PAD_X, HEAD_BASELINE_1, INK)}
{render(DISPLAY, HEAD_LINE_2, HEAD_SIZE, HEAD_TRACK, PAD_X, HEAD_BASELINE_1 + HEAD_LEADING, INK, accent=SET_B)}
{render(MONO, domain, DOMAIN_SIZE, DOMAIN_TRACK, PAD_X, DOMAIN_BASELINE, MUTED)}
</svg>"""


os.makedirs("og", exist_ok=True)
for name, (eyebrow, domain) in VARIANTS.items():
    with open(f"og/og-{name}.svg", "w") as f:
        f.write(card(eyebrow, domain))

print(
    f"headline size {HEAD_SIZE}px in a {COL_W:.0f}px column; "
    f"written: {', '.join(f'og/og-{n}.svg' for n in VARIANTS)} — "
    "now rasterize to PNG and run scripts/sync-brand.mjs (see README.md)"
)
