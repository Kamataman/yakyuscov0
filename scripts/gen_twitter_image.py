#!/usr/bin/env python3
"""やきゅスコ Twitter プロモーション画像生成スクリプト"""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 675
OUT = os.path.join(os.path.dirname(__file__), "../public/twitter-promo.png")

FONT_PATH = "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf"

def load_font(size):
    return ImageFont.truetype(FONT_PATH, size)

def hex_color(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# --- Colors (dark slate theme matching the app) ---
BG_TOP      = hex_color("0f172a")
BG_BOTTOM   = hex_color("1e293b")
BLUE        = hex_color("2563eb")
BLUE_LIGHT  = hex_color("60a5fa")
BLUE_MUTED  = hex_color("1d4ed8")
GREEN       = hex_color("10b981")
GREEN_MUTED = hex_color("064e3b")
PURPLE      = hex_color("a78bfa")
PURPLE_MUTED= hex_color("2d1b69")
SLATE_400   = hex_color("94a3b8")
SLATE_600   = hex_color("475569")
SLATE_700   = hex_color("334155")
SLATE_800   = hex_color("1e293b")
WHITE       = (255, 255, 255)

def gradient_bg(draw):
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

def rounded_rect(draw, xy, radius, fill, border=None, border_width=2):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill,
                           outline=border, width=border_width)

def draw_badge(draw, x, y, w, h, text, bg, border, text_color, font):
    rounded_rect(draw, [x, y, x+w, y+h], radius=10, fill=bg, border=border, border_width=2)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (w - tw) // 2, y + (h - th) // 2 - bbox[1]), text, font=font, fill=text_color)

def draw_scoreboard(draw, x, y):
    """イニングスコア表のモックアップ"""
    cell_w, cell_h = 48, 36
    innings = [1, 2, 3, 4, 5, 6, 7, 8, 9, "計"]
    our_scores  = [0, 2, 0, 1, 3, 0, 0, 1, 0, 7]
    opp_scores  = [1, 0, 0, 0, 1, 0, 2, 0, 0, 4]

    header_font = load_font(17)
    score_font  = load_font(20)
    label_font  = load_font(17)

    total_w = len(innings) * cell_w + 80
    total_h = cell_h * 3

    rounded_rect(draw, [x, y, x + total_w, y + total_h],
                 radius=12, fill=hex_color("0f172a"), border=SLATE_600, border_width=1)

    # header row
    for i, ing in enumerate(innings):
        cx = x + 80 + i * cell_w
        is_last = (i == len(innings) - 1)
        if is_last:
            draw.rectangle([cx, y, cx + cell_w - 1, y + cell_h], fill=BLUE_MUTED)
        col = WHITE if is_last else SLATE_400
        bbox = header_font.getbbox(str(ing))
        tw = bbox[2] - bbox[0]
        draw.text((cx + (cell_w - tw) // 2, y + 8), str(ing), font=header_font, fill=col)

    # team labels & scores
    for row_i, (label, scores) in enumerate([("チーム", our_scores), ("相手", opp_scores)]):
        ry = y + cell_h * (row_i + 1)
        row_bg = hex_color("1e293b") if row_i == 0 else hex_color("162032")
        draw.rectangle([x, ry, x + total_w, ry + cell_h - 1], fill=row_bg)

        bbox = label_font.getbbox(label)
        tw = bbox[2] - bbox[0]
        draw.text((x + (80 - tw) // 2, ry + 8), label, font=label_font, fill=WHITE if row_i == 0 else SLATE_400)

        for i, sc in enumerate(scores):
            cx = x + 80 + i * cell_w
            is_last = (i == len(innings) - 1)
            is_win = (row_i == 0 and sc > opp_scores[i] and not is_last)
            col = GREEN if (is_last and sc > (7 if row_i == 1 else 4)) else (GREEN if is_win else WHITE)
            if is_last:
                col = GREEN if row_i == 0 else SLATE_400
            bbox = score_font.getbbox(str(sc))
            tw = bbox[2] - bbox[0]
            draw.text((cx + (cell_w - tw) // 2, ry + 7), str(sc), font=score_font, fill=col)

    # 勝利マーク
    win_font = load_font(15)
    draw.ellipse([x + 4, y + cell_h + 12, x + 16, y + cell_h + 24], fill=GREEN)


def draw_stat_card(draw, x, y, w, h, name, value, sub, color):
    rounded_rect(draw, [x, y, x+w, y+h], radius=14, fill=SLATE_800, border=SLATE_600, border_width=1)
    nf = load_font(18)
    vf = load_font(38)
    sf = load_font(16)
    draw.text((x + 16, y + 12), name, font=nf, fill=SLATE_400)
    bbox = vf.getbbox(value)
    draw.text((x + 16, y + 36), value, font=vf, fill=color)
    draw.text((x + 16, y + h - 28), sub, font=sf, fill=SLATE_400)


def main():
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)

    # Background gradient
    gradient_bg(draw)

    # Decorative circle accents
    draw.ellipse([-80, -80, 220, 220], fill=hex_color("1e3a8a") + (0,))
    draw.ellipse([W - 180, H - 180, W + 80, H + 80], fill=hex_color("1e3a8a"))

    # ===== LEFT COLUMN =====
    lx = 60

    # App name (big)
    title_font = load_font(80)
    draw.text((lx, 60), "やきゅスコ", font=title_font, fill=WHITE)

    # Tagline
    tag_font = load_font(24)
    draw.text((lx, 162), "野球チームの試合結果・個人成績を", font=tag_font, fill=SLATE_400)
    draw.text((lx, 192), "スマホから簡単に記録・管理", font=tag_font, fill=SLATE_400)

    # Feature badges
    bf = load_font(20)
    badges = [
        ("■ 試合スコア記録", hex_color("1e3a5f"), hex_color("3b82f6"), BLUE_LIGHT),
        ("▲ 打率・OPS自動計算", GREEN_MUTED, GREEN, GREEN),
        ("★ 投手成績管理", PURPLE_MUTED, PURPLE, PURPLE),
    ]
    by = 240
    for label, bg, border, tc in badges:
        tw = bf.getbbox(label)[2] - bf.getbbox(label)[0] + 32
        rounded_rect(draw, [lx, by, lx + tw, by + 38], radius=8,
                     fill=bg, border=border, border_width=2)
        draw.text((lx + 14, by + 7), label, font=bf, fill=tc)
        by += 52

    # URL / CTA area
    url_font = load_font(22)
    draw.text((lx, 406), "yakyusco.kamata.men", font=url_font, fill=SLATE_400)

    # CTA Button
    cta_font = load_font(26)
    cta_w, cta_h = 260, 56
    cta_x, cta_y = lx, 446
    rounded_rect(draw, [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h],
                 radius=14, fill=BLUE)
    cta_text = "無料で始める →"
    bbox = cta_font.getbbox(cta_text)
    tw = bbox[2] - bbox[0]
    draw.text((cta_x + (cta_w - tw) // 2, cta_y + 12), cta_text, font=cta_font, fill=WHITE)

    # Free badge
    free_font = load_font(17)
    draw.text((lx, 516), "◎ 登録無料  ◎ クレカ不要  ◎ スマホ対応", font=free_font, fill=SLATE_400)

    # ===== RIGHT COLUMN =====
    rx = 560

    # Scoreboard mock
    draw_scoreboard(draw, rx, 68)

    # Stat cards
    stats = [
        (".342", "山田 太郎", "打率", BLUE_LIGHT),
        (".921", "田中 一朗", "OPS", GREEN),
        ("2.14", "鈴木 投手", "防御率", PURPLE),
    ]
    card_w = 190
    card_h = 110
    cx = rx
    for i, (val, name, label, col) in enumerate(stats):
        draw_stat_card(draw, cx, 200, card_w, card_h, label, val, name, col)
        cx += card_w + 14

    # Score sharing section (mock)
    sf_font = load_font(19)
    share_y = 332
    rounded_rect(draw, [rx, share_y, rx + 618, share_y + 66],
                 radius=12, fill=SLATE_800, border=SLATE_600, border_width=1)
    draw.text((rx + 16, share_y + 10), "■ 試合結果をURLで簡単共有", font=sf_font, fill=SLATE_400)
    link_font = load_font(17)
    draw.text((rx + 16, share_y + 38), "yakyusco.kamata.men/share/abc123", font=link_font, fill=BLUE_LIGHT)

    # Player stats table mock
    tbl_y = 418
    tbl_headers = ["選手名", "打数", "安打", "打率", "HR", "打点"]
    tbl_data = [
        ["山田 太郎", "120", "41", ".342", "5", "28"],
        ["田中 一朗", "98",  "31", ".316", "3", "19"],
        ["佐藤 花子", "87",  "24", ".276", "1", "12"],
    ]
    col_ws = [110, 50, 50, 60, 40, 50]
    th_font = load_font(16)
    td_font = load_font(16)

    rounded_rect(draw, [rx, tbl_y, rx + 620, tbl_y + 36 + len(tbl_data) * 34],
                 radius=12, fill=hex_color("0f172a"), border=SLATE_600, border_width=1)

    # header
    hx = rx + 8
    for ci, (hdr, cw) in enumerate(zip(tbl_headers, col_ws)):
        draw.text((hx + 4, tbl_y + 8), hdr, font=th_font, fill=SLATE_400)
        hx += cw

    for ri, row in enumerate(tbl_data):
        ry2 = tbl_y + 36 + ri * 34
        row_bg = hex_color("1e293b") if ri % 2 == 0 else hex_color("162032")
        draw.rectangle([rx + 1, ry2, rx + 619, ry2 + 33], fill=row_bg)
        hx = rx + 8
        for ci, (cell, cw) in enumerate(zip(row, col_ws)):
            col = GREEN if (ci == 3 and float(cell) >= 0.340) else WHITE
            draw.text((hx + 4, ry2 + 7), cell, font=td_font, fill=col)
            hx += cw

    img.save(OUT, "PNG", optimize=True)
    print(f"Saved: {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
