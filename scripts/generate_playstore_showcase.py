import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def draw_linear_gradient(draw, width, height, start_color, mid_color, end_color):
    for y in range(height):
        t = y / height
        if t < 0.5:
            factor = t / 0.5
            r = int(start_color[0] + (mid_color[0] - start_color[0]) * factor)
            g = int(start_color[1] + (mid_color[1] - start_color[1]) * factor)
            b = int(start_color[2] + (mid_color[2] - start_color[2]) * factor)
        else:
            factor = (t - 0.5) / 0.5
            r = int(mid_color[0] + (end_color[0] - mid_color[0]) * factor)
            g = int(mid_color[1] + (end_color[1] - mid_color[1]) * factor)
            b = int(end_color[2] + (end_color[2] - end_color[2]) * factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

def draw_glow_circle(base_img, center, radius, color, max_alpha=90):
    glow = Image.new('RGBA', base_img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = center
    # Draw soft concentric circles
    for r in range(radius, 0, -10):
        alpha = int(max_alpha * (1.0 - (r / radius) ** 0.8))
        glow_draw.ellipse(
            [(cx - r, cy - r), (cx + r, cy + r)],
            fill=(color[0], color[1], color[2], alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    base_img.alpha_composite(glow)

def add_drop_shadow(canvas, box, radius, shadow_color=(0, 0, 0, 160), blur=35, offset=(0, 20)):
    x0, y0, x1, y1 = box
    sw = (x1 - x0) + blur * 4
    sh = (y1 - y0) + blur * 4
    shadow_layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    sx0 = x0 + offset[0]
    sy0 = y0 + offset[1]
    sx1 = x1 + offset[0]
    sy1 = y1 + offset[1]
    s_draw.rounded_rectangle([(sx0, sy0), (sx1, sy1)], radius=radius, fill=shadow_color)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow_layer)

def make_phone_mockup(app_screenshot_path, target_width=780, target_height=1620, corner_radius=56):
    raw_img = Image.open(app_screenshot_path).convert('RGBA')
    rw, rh = raw_img.size

    # Crop status bar (~65px) and bottom nav (~40px)
    crop_top = int(rh * 0.042)  # ~67px
    crop_bottom = int(rh * 0.025)  # ~40px
    cropped = raw_img.crop((0, crop_top, rw, rh - crop_bottom))

    # Inner screen size
    bezel = 12
    screen_w = target_width - (bezel * 2)
    screen_h = target_height - (bezel * 2)

    # Resize cropped screen
    screen_resized = cropped.resize((screen_w, screen_h), Image.Resampling.LANCZOS)

    # Round inner screen corners
    screen_mask = create_rounded_mask((screen_w, screen_h), corner_radius - 8)
    screen_with_alpha = Image.new('RGBA', (screen_w, screen_h), (0, 0, 0, 0))
    screen_with_alpha.paste(screen_resized, (0, 0), screen_mask)

    # Create Phone Chassis
    phone = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(phone)

    # Outer titanium border
    p_draw.rounded_rectangle([(0, 0), (target_width, target_height)], radius=corner_radius, fill=(28, 30, 36, 255))
    # Subtle metal rim
    p_draw.rounded_rectangle([(2, 2), (target_width - 2, target_height - 2)], radius=corner_radius - 2, outline=(75, 82, 95, 200), width=2)
    # Inner bezel
    p_draw.rounded_rectangle([(bezel - 2, bezel - 2), (target_width - bezel + 2, target_height - bezel + 2)], radius=corner_radius - 6, fill=(15, 17, 20, 255))

    # Paste screen
    phone.paste(screen_with_alpha, (bezel, bezel), screen_with_alpha)

    # Punch-hole camera (pill or dynamic circle)
    cam_cx = target_width // 2
    cam_cy = bezel + 24
    cam_r = 11
    p_draw.ellipse([(cam_cx - cam_r, cam_cy - cam_r), (cam_cx + cam_r, cam_cy + cam_r)], fill=(8, 8, 10, 255))
    p_draw.ellipse([(cam_cx - 4, cam_cy - 4), (cam_cx + 4, cam_cy + 4)], fill=(20, 25, 45, 200))

    # Glass highlight reflection
    glass = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glass)
    g_draw.polygon([(0, 0), (target_width * 0.75, 0), (0, target_height * 0.45)], fill=(255, 255, 255, 14))
    phone = Image.alpha_composite(phone, glass)

    return phone

def draw_pill_badge(canvas, center_x, y, text, font, bg_color=(255, 255, 255, 30), border_color=(255, 255, 255, 70), text_color=(255, 255, 255, 255)):
    temp_draw = ImageDraw.Draw(canvas)
    bbox = temp_draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    pad_h = 32
    pad_v = 14
    bw = tw + pad_h * 2
    bh = th + pad_v * 2
    bx0 = int(center_x - bw / 2)
    by0 = y
    bx1 = bx0 + bw
    by1 = by0 + bh

    badge_img = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(badge_img)
    b_draw.rounded_rectangle([(bx0, by0), (bx1, by1)], radius=bh//2, fill=bg_color, outline=border_color, width=2)
    b_draw.text((bx0 + pad_h, by0 + pad_v - 2), text, font=font, fill=text_color)
    canvas.alpha_composite(badge_img)
    return by1

def draw_floating_card(canvas, x, y, icon_text, title, subtitle, font_title, font_sub, bg_color=(20, 25, 35, 230), border_color=(255, 255, 255, 50)):
    # Glass card with drop shadow
    temp_draw = ImageDraw.Draw(canvas)
    bbox_t = temp_draw.textbbox((0, 0), title, font=font_title)
    bbox_s = temp_draw.textbbox((0, 0), subtitle, font=font_sub)
    
    content_w = max(bbox_t[2] - bbox_t[0], bbox_s[2] - bbox_s[0]) + 70
    card_w = content_w + 50
    card_h = 92
    
    # Shadow
    add_drop_shadow(canvas, (x, y, x + card_w, y + card_h), radius=26, shadow_color=(0, 0, 0, 160), blur=24, offset=(0, 12))
    
    card_img = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_img)
    c_draw.rounded_rectangle([(x, y), (x + card_w, y + card_h)], radius=26, fill=bg_color, outline=border_color, width=2)
    
    # Text
    c_draw.text((x + 24, y + 20), icon_text, font=font_title, fill=(255, 215, 0, 255))
    c_draw.text((x + 72, y + 16), title, font=font_title, fill=(255, 255, 255, 255))
    c_draw.text((x + 72, y + 48), subtitle, font=font_sub, fill=(180, 195, 215, 255))
    canvas.alpha_composite(card_img)

def generate_showcase(config):
    width = 1080
    height = 2280
    
    canvas = Image.new('RGBA', (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(canvas)
    
    # 1. Background Gradient
    draw_linear_gradient(draw, width, height, config['bg_start'], config['bg_mid'], config['bg_end'])
    
    # 2. Glowing atmospheric orbs
    draw_glow_circle(canvas, config['glow_pos1'], config['glow_radius1'], config['glow_color1'], 80)
    draw_glow_circle(canvas, config['glow_pos2'], config['glow_radius2'], config['glow_color2'], 60)
    
    # Fonts
    font_pill = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 30)
    font_head = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 62)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 32)
    font_card_t = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
    font_card_s = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
    
    # 3. Top Pill Badge
    pill_y = 110
    pill_end_y = draw_pill_badge(
        canvas, width // 2, pill_y, 
        config['badge_text'], font_pill, 
        bg_color=config['badge_bg'], 
        border_color=config['badge_border'],
        text_color=config['badge_color']
    )
    
    # 4. Headline (2 lines)
    t_draw = ImageDraw.Draw(canvas)
    line1 = config['headline_1']
    line2 = config['headline_2']
    
    b1 = t_draw.textbbox((0, 0), line1, font=font_head)
    b2 = t_draw.textbbox((0, 0), line2, font=font_head)
    
    head_y = pill_end_y + 42
    x1 = (width - (b1[2] - b1[0])) // 2
    x2 = (width - (b2[2] - b2[0])) // 2
    
    t_draw.text((x1, head_y), line1, font=font_head, fill=(255, 255, 255, 255))
    t_draw.text((x2, head_y + 72), line2, font=font_head, fill=config['accent_color'])
    
    # 5. Subtitle
    sub_text = config['subtitle']
    b_sub = t_draw.textbbox((0, 0), sub_text, font=font_sub)
    x_sub = (width - (b_sub[2] - b_sub[0])) // 2
    sub_y = head_y + 162
    t_draw.text((x_sub, sub_y), sub_text, font=font_sub, fill=(195, 205, 225, 255))
    
    # 6. Phone Mockup
    mockup_w = 780
    mockup_h = 1620
    phone = make_phone_mockup(config['screenshot_path'], target_width=mockup_w, target_height=mockup_h, corner_radius=58)
    
    phone_x = (width - mockup_w) // 2
    phone_y = 660
    
    # Add deep shadow behind phone
    add_drop_shadow(
        canvas, 
        (phone_x, phone_y, phone_x + mockup_w, phone_y + mockup_h), 
        radius=58, 
        shadow_color=(0, 0, 0, 180), 
        blur=45, 
        offset=(0, 25)
    )
    
    # Paste Phone
    canvas.paste(phone, (phone_x, phone_y), phone)
    
    # 7. Overlapping Character / Mascot
    char_path = config.get('character_path')
    if char_path and os.path.exists(char_path):
        char_img = Image.open(char_path).convert('RGBA')
        char_w, char_h = config['char_size']
        char_resized = char_img.resize((char_w, char_h), Image.Resampling.LANCZOS)
        cx, cy = config['char_pos']
        
        # Shadow for character
        char_shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        cs_draw = ImageDraw.Draw(char_shadow)
        # Soft mask of character for shadow
        cs_mask = char_resized.split()[3]
        char_shadow.paste(Image.new('RGBA', (char_w, char_h), (0, 0, 0, 150)), (cx + 8, cy + 18), cs_mask)
        char_shadow = char_shadow.filter(ImageFilter.GaussianBlur(18))
        canvas.alpha_composite(char_shadow)
        
        # Paste Character
        canvas.paste(char_resized, (cx, cy), char_resized)
        
    # 8. Floating Feature Card
    card_cfg = config.get('floating_card')
    if card_cfg:
        draw_floating_card(
            canvas, 
            card_cfg['x'], card_cfg['y'], 
            card_cfg['icon'], card_cfg['title'], card_cfg['subtitle'],
            font_card_t, font_card_s,
            bg_color=card_cfg.get('bg', (16, 22, 36, 235)),
            border_color=card_cfg.get('border', (255, 255, 255, 60))
        )
        
    # Save final output
    out_path = config['output_path']
    canvas.convert('RGB').save(out_path, 'PNG', quality=98)
    print(f"Saved: {out_path}")

def main():
    desktop_dir = r"C:\Users\Hp\Desktop\stay q"
    assets_dir = r"d:\Stay Q\assets\images"
    
    configs = [
        # SHOWCASE 1: Home / Explore Screen
        {
            'screenshot_path': os.path.join(desktop_dir, "WhatsApp Image 2026-09-22 at 4.31.48 PM.jpeg"),
            'output_path': os.path.join(desktop_dir, "showcase_1.png"),
            'bg_start': (8, 14, 34),
            'bg_mid': (15, 30, 68),
            'bg_end': (9, 44, 76),
            'glow_pos1': (200, 450),
            'glow_radius1': 480,
            'glow_color1': (0, 190, 255),
            'glow_pos2': (880, 1350),
            'glow_radius2': 550,
            'glow_color2': (30, 100, 255),
            'badge_text': "✨ DIRECT CONNECT • 0% BROKERAGE",
            'badge_bg': (0, 180, 255, 40),
            'badge_border': (0, 200, 255, 120),
            'badge_color': (140, 225, 255, 255),
            'headline_1': "Discover Unique Stays",
            'headline_2': "& Luxury Campervans",
            'accent_color': (255, 204, 0, 255),
            'subtitle': "Book Direct with Verified Hosts • Pay Zero Commission",
            'character_path': os.path.join(assets_dir, "user_welcome_mascot.png"),
            'char_size': (380, 475),
            'char_pos': (710, 820),
            'floating_card': {
                'x': 50,
                'y': 1580,
                'icon': "⭐",
                'title': "Zero Brokerage",
                'subtitle': "Direct Host Connect",
                'bg': (10, 20, 38, 230),
                'border': (0, 190, 255, 75)
            }
        },
        # SHOWCASE 2: Luxury Campervans
        {
            'screenshot_path': os.path.join(desktop_dir, "c2a835b9-17c9-478e-9bae-41640344adc7.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_2.png"),
            'bg_start': (6, 24, 18),
            'bg_mid': (11, 48, 36),
            'bg_end': (18, 72, 54),
            'glow_pos1': (250, 400),
            'glow_radius1': 500,
            'glow_color1': (16, 210, 140),
            'glow_pos2': (850, 1400),
            'glow_radius2': 520,
            'glow_color2': (0, 160, 110),
            'badge_text': "🚐 OVERLANDING & VAN LIFE",
            'badge_bg': (16, 185, 129, 45),
            'badge_border': (16, 210, 140, 130),
            'badge_color': (150, 255, 210, 255),
            'headline_1': "Luxury Campervans",
            'headline_2': "Your Hotel on Wheels",
            'accent_color': (74, 222, 128, 255),
            'subtitle': "Queen Bed, AC, Kitchen & Washroom for Scenic Trips",
            'character_path': os.path.join(assets_dir, "mascot_rv.png"),
            'char_size': (370, 370),
            'char_pos': (715, 870),
            'floating_card': {
                'x': 50,
                'y': 1580,
                'icon': "❄️",
                'title': "Bed & AC on Wheels",
                'subtitle': "Kitchen & Washroom Included",
                'bg': (8, 32, 24, 230),
                'border': (16, 210, 140, 80)
            }
        },
        # SHOWCASE 3: Qube AI Concierge
        {
            'screenshot_path': os.path.join(desktop_dir, "WhatsApp Image 2026-09-22 at 4.31.48 PM (1).jpeg"),
            'output_path': os.path.join(desktop_dir, "showcase_3.png"),
            'bg_start': (14, 8, 36),
            'bg_mid': (32, 16, 68),
            'bg_end': (55, 24, 105),
            'glow_pos1': (200, 420),
            'glow_radius1': 480,
            'glow_color1': (180, 80, 255),
            'glow_pos2': (860, 1300),
            'glow_radius2': 500,
            'glow_color2': (230, 90, 210),
            'badge_text': "🤖 QUBE AI TRAVEL PLANNER",
            'badge_bg': (168, 85, 247, 45),
            'badge_border': (192, 132, 252, 130),
            'badge_color': (230, 200, 255, 255),
            'headline_1': "Your Personal AI",
            'headline_2': "Travel Concierge",
            'accent_color': (216, 180, 254, 255),
            'subtitle': "Instant Custom Itineraries, Hidden Gems & 24/7 Roadtrip Help",
            'character_path': os.path.join(assets_dir, "qube_planner_character.jpg"),
            'char_size': (360, 360),
            'char_pos': (720, 880),
            'floating_card': {
                'x': 50,
                'y': 1580,
                'icon': "⚡",
                'title': "Custom Itineraries",
                'subtitle': "Tailored in Seconds by AI",
                'bg': (24, 12, 48, 230),
                'border': (192, 132, 252, 80)
            }
        },
        # SHOWCASE 4: Interactive Map Discovery
        {
            'screenshot_path': os.path.join(desktop_dir, "1c4bcf4f-4891-47c4-b7fa-eae1bc0f2d2f.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_4.png"),
            'bg_start': (7, 22, 42),
            'bg_mid': (14, 42, 78),
            'bg_end': (20, 68, 115),
            'glow_pos1': (220, 420),
            'glow_radius1': 500,
            'glow_color1': (30, 160, 255),
            'glow_pos2': (850, 1380),
            'glow_radius2': 520,
            'glow_color2': (0, 210, 255),
            'badge_text': "🗺️ LIVE MAP DISCOVERY",
            'badge_bg': (14, 165, 233, 45),
            'badge_border': (56, 189, 248, 130),
            'badge_color': (186, 230, 253, 255),
            'headline_1': "Explore Stays Near & Far",
            'headline_2': "Interactive Live Map",
            'accent_color': (56, 189, 248, 255),
            'subtitle': "Find Pool Villas, Beach Huts & RV Campsites with Direct Prices",
            'character_path': os.path.join(assets_dir, "mascot_camping.png"),
            'char_size': (360, 360),
            'char_pos': (720, 880),
            'floating_card': {
                'x': 50,
                'y': 1580,
                'icon': "📍",
                'title': "Real-Time Map Pins",
                'subtitle': "Instant Booking & Direction",
                'bg': (10, 30, 56, 230),
                'border': (56, 189, 248, 80)
            }
        },
        # SHOWCASE 5: Host Portal & Dashboard
        {
            'screenshot_path': os.path.join(desktop_dir, "2cc34240-a2a3-41fe-a0de-c357a71c7235.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_5.png"),
            'bg_start': (22, 17, 8),
            'bg_mid': (45, 32, 14),
            'bg_end': (72, 50, 18),
            'glow_pos1': (240, 420),
            'glow_radius1': 500,
            'glow_color1': (245, 170, 30),
            'glow_pos2': (850, 1380),
            'glow_radius2': 520,
            'glow_color2': (255, 195, 60),
            'badge_text': "💼 ZERO COMMISSION HOSTING",
            'badge_bg': (234, 179, 8, 45),
            'badge_border': (250, 204, 21, 130),
            'badge_color': (254, 240, 138, 255),
            'headline_1': "List Your Property",
            'headline_2': "Keep 100% of Earnings",
            'accent_color': (250, 204, 21, 255),
            'subtitle': "Zero Brokerage • Direct Guest Connect • Instant Payouts",
            'character_path': os.path.join(assets_dir, "host_welcome_mascot.png"),
            'char_size': (370, 460),
            'char_pos': (715, 830),
            'floating_card': {
                'x': 50,
                'y': 1580,
                'icon': "💰",
                'title': "100% Host Payouts",
                'subtitle': "0% Commission Forever",
                'bg': (32, 22, 10, 230),
                'border': (250, 204, 21, 80)
            }
        }
    ]
    
    for cfg in configs:
        generate_showcase(cfg)
    print("All 5 showcase graphics successfully generated!")

if __name__ == "__main__":
    main()
