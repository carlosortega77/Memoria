from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
SIZES = [180, 192, 512]

CREAM = (250, 249, 245)
INK = (26, 26, 26)
ACCENT = (44, 95, 141)
GREY = (107, 107, 107)

GEORGIA_ITALIC = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
MENLO = "/System/Library/Fonts/Menlo.ttc"


def render(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), CREAM)
    d = ImageDraw.Draw(img)

    cx = cy = size / 2
    r = size * 0.31
    stroke = max(2, int(size * 0.0125))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=stroke)

    glyph_size = int(size * 0.37)
    glyph_font = ImageFont.truetype(GEORGIA_ITALIC, glyph_size)
    bbox = glyph_font.getbbox("M")
    gw = bbox[2] - bbox[0]
    gh = bbox[3] - bbox[1]
    d.text(
        (cx - gw / 2 - bbox[0], cy - gh / 2 - bbox[1] - size * 0.02),
        "M",
        font=glyph_font,
        fill=ACCENT,
    )

    label_size = max(8, int(size * 0.045))
    label_font = ImageFont.truetype(MENLO, label_size)
    label = "MEMORIA"
    lbbox = label_font.getbbox(label)
    lw = lbbox[2] - lbbox[0]
    d.text(
        (cx - lw / 2 - lbbox[0], cy + size * 0.20),
        label,
        font=label_font,
        fill=GREY,
    )

    return img


for s in SIZES:
    img = render(s)
    img.save(OUT / f"icon-{s}.png", "PNG", optimize=True)
    print(f"wrote {OUT}/icon-{s}.png")
