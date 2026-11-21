"""Generate the RegexSolver logo lockup as SVG.

Mark: two automaton-state circles (ink A, ink B) whose intersection lens is
filled with the overlap colour — the two-inks identity drawn as geometry.
Wordmark: "regexsolver" in Martian Mono (wdth 87.5, wght 700) converted to
paths.
"""

import json
import math

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def load(path, axes):
    f = TTFont(path)
    instantiateVariableFont(f, axes, inplace=True)
    return f


MM = load("martian.ttf", {"wdth": 87.5, "wght": 700})

UPM = MM["head"].unitsPerEm
CAP = MM["OS/2"].sCapHeight
TRACK = -0.02 * UPM  # the brief's -0.02em display tracking

print(f"UPM={UPM} CAP={CAP}")


def glyph(font, ch, x, scale):
    gs = font.getGlyphSet()
    gname = font.getBestCmap()[ord(ch)]
    pen = SVGPathPen(gs)
    tf = Transform(scale, 0, 0, -scale, x, 0)  # flip y for SVG
    gs[gname].draw(TransformPen(pen, tf))
    bp = BoundsPen(gs)
    gs[gname].draw(TransformPen(bp, tf))
    return pen.getCommands(), gs[gname].width * scale, bp.bounds


def text(font, s, x0, scale=1.0):
    parts, x, bounds = [], x0, None
    for ch in s:
        d, adv, b = glyph(font, ch, x, scale)
        parts.append(d)
        if b:
            bounds = (
                b if bounds is None else (
                    min(bounds[0], b[0]), min(bounds[1], b[1]),
                    max(bounds[2], b[2]), max(bounds[3], b[3]),
                )
            )
        x += adv + TRACK
    return " ".join(parts), x - TRACK, bounds


# ---- Mark geometry (y = 0 is the text baseline; up is negative) ----
R = CAP * 0.52           # state-circle radius
STROKE = UPM * 0.062     # ink stroke weight
D = R * 1.45             # distance between circle centres
CY = -CAP / 2            # vertically centred on the cap height
C1X = R + STROKE / 2
C2X = C1X + D

# Lens (intersection of the two circles) as two arcs.
half = D / 2
h = math.sqrt(R * R - half * half)
mx = (C1X + C2X) / 2
LENS = (
    f"M {mx:.1f} {CY - h:.1f} "
    f"A {R:.1f} {R:.1f} 0 0 1 {mx:.1f} {CY + h:.1f} "
    f"A {R:.1f} {R:.1f} 0 0 1 {mx:.1f} {CY - h:.1f} Z"
)

MARK_W = 2 * R + D + STROKE
GAP = UPM * 0.30

# ---- Wordmark ----
x = MARK_W + GAP
d_word, x, bw = text(MM, "regexsolver", x)

TOTAL_W = x
TOP = min(CY - R - STROKE / 2, bw[1])
BOT = max(CY + R + STROKE / 2, bw[3])
PAD = STROKE
VB = (0 - PAD, TOP - PAD, TOTAL_W + 2 * PAD, (BOT - TOP) + 2 * PAD)

print(f"lockup viewBox: {VB}, aspect {VB[2]/VB[3]:.2f}")


def lockup_svg(a, b, overlap, ink, double_ring=False):
    inner = ""
    if double_ring:
        r_in = R - STROKE * 2.2
        inner = (
            f'<circle cx="{C2X:.1f}" cy="{CY:.1f}" r="{r_in:.1f}" '
            f'fill="none" stroke="{b}" stroke-width="{STROKE * 0.8:.1f}"/>'
        )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB[0]:.1f} {VB[1]:.1f} {VB[2]:.1f} {VB[3]:.1f}" role="img" aria-label="RegexSolver">
  <path d="{LENS}" fill="{overlap}"/>
  <circle cx="{C1X:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="none" stroke="{a}" stroke-width="{STROKE:.1f}"/>
  <circle cx="{C2X:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="none" stroke="{b}" stroke-width="{STROKE:.1f}"/>
  {inner}
  <path d="{d_word}" fill="{ink}"/>
</svg>"""


def mark_svg(a, b, overlap, double_ring=False):
    pad = STROKE
    vb = (
        C1X - R - pad, CY - R - pad,
        (C2X + R + pad) - (C1X - R - pad), 2 * (R + pad),
    )
    inner = ""
    if double_ring:
        r_in = R - STROKE * 2.2
        inner = (
            f'<circle cx="{C2X:.1f}" cy="{CY:.1f}" r="{r_in:.1f}" '
            f'fill="none" stroke="{b}" stroke-width="{STROKE * 0.8:.1f}"/>'
        )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}" role="img" aria-label="RegexSolver">
  <path d="{LENS}" fill="{overlap}"/>
  <circle cx="{C1X:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="none" stroke="{a}" stroke-width="{STROKE:.1f}"/>
  <circle cx="{C2X:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="none" stroke="{b}" stroke-width="{STROKE:.1f}"/>
  {inner}
</svg>"""


LIGHT = dict(a="#2A3FD4", b="#D13E1E", overlap="#6E2C6B", ink="#141416")
DARK = dict(a="#93A0F4", b="#EC8168", overlap="#C98FC5", ink="#EDECE6")

with open("logo-light.svg", "w") as f:
    f.write(lockup_svg(**LIGHT))
with open("logo-dark.svg", "w") as f:
    f.write(lockup_svg(**DARK))
with open("mark-light.svg", "w") as f:
    f.write(mark_svg(LIGHT["a"], LIGHT["b"], LIGHT["overlap"]))
with open("mark-dark.svg", "w") as f:
    f.write(mark_svg(DARK["a"], DARK["b"], DARK["overlap"]))

# ---- Favicon source: the mark on a square canvas, strokes thickened for
# small-size legibility (7.5% of canvas ≈ 1.2px at 16px). ----
FAV_S, FAV_STROKE = 1600.0, 120.0
fav_mark_w = 2 * R + D + FAV_STROKE
fav_c1x = (FAV_S - fav_mark_w) / 2 + R + FAV_STROKE / 2
fav_c2x = fav_c1x + D
fav_cy = FAV_S / 2
fav_mx = (fav_c1x + fav_c2x) / 2
FAV_LENS = (
    f"M {fav_mx:.1f} {fav_cy - h:.1f} A {R} {R} 0 0 1 {fav_mx:.1f} {fav_cy + h:.1f} "
    f"A {R} {R} 0 0 1 {fav_mx:.1f} {fav_cy - h:.1f} Z"
)
FAVICON_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {FAV_S:.0f} {FAV_S:.0f}">
  <path d="{FAV_LENS}" fill="{LIGHT['overlap']}"/>
  <circle cx="{fav_c1x:.1f}" cy="{fav_cy:.1f}" r="{R}" fill="none" stroke="{LIGHT['a']}" stroke-width="{FAV_STROKE}"/>
  <circle cx="{fav_c2x:.1f}" cy="{fav_cy:.1f}" r="{R}" fill="none" stroke="{LIGHT['b']}" stroke-width="{FAV_STROKE}"/>
</svg>"""
with open("favicon-mark.svg", "w") as f:
    f.write(FAVICON_SVG)

# ---- Shared data module for the React <Logo/> components ----
mark_vb = f"{C1X - R - STROKE:.1f} {CY - R - STROKE:.1f} {(C2X + R + STROKE) - (C1X - R - STROKE):.1f} {2 * (R + STROKE):.1f}"
brand_ts = f'''/* AUTO-GENERATED by brand/gen_logo.py — do not edit by hand.
   The RegexSolver lockup as raw SVG data: two automaton-state circles whose
   intersection lens is the overlap colour, wordmark as Martian Mono
   (wdth 87.5, wght 700) paths.
   Per this package's rules there are no runtime imports here — each app
   renders this data with its own thin <Logo/> component, colouring it via
   the identity's CSS tokens (--set-a, --set-b, --overlap, --ink). */

export const LOGO_VIEWBOX = "{VB[0]:.1f} {VB[1]:.1f} {VB[2]:.1f} {VB[3]:.1f}";
export const MARK_VIEWBOX = "{mark_vb}";
export const LOGO_STROKE = {round(STROKE, 1)};
export const LOGO_CIRCLE_A = {{ cx: {round(C1X, 1)}, cy: {round(CY, 1)}, r: {round(R, 1)} }};
export const LOGO_CIRCLE_B = {{ cx: {round(C2X, 1)}, cy: {round(CY, 1)}, r: {round(R, 1)} }};
export const LOGO_LENS = "{LENS}";
export const LOGO_TEXT_WORD = "{d_word}";
'''
with open("../src/brand.ts", "w") as f:
    f.write(brand_ts)

print(
    "written: logo-light/dark.svg, mark-light/dark.svg, favicon-mark.svg, "
    "../src/brand.ts — then rasterize favicons (see README) and run "
    "scripts/sync-brand.mjs"
)
