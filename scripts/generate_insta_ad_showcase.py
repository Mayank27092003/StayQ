import os
import math
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def cutout_exterior_white(img_path, tolerance=30, feather=2):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    
    diff = np.sqrt(np.sum((arr[:, :, :3] - 255.0) ** 2, axis=2))
    is_white = (diff < tolerance)
    
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    for x in range(w):
        if is_white[0, x]:
            queue.append((0, x))
            visited[0, x] = True
        if is_white[h - 1, x]:
            queue.append((h - 1, x))
            visited[h - 1, x] = True
            
    for y in range(h):
        if is_white[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if is_white[y, w - 1]:
            queue.append((y, w - 1))
            visited[y, w - 1] = True
            
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_white[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
                    
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[visited] = 0.0
    
    alpha_img = Image.fromarray(alpha.astype(np.uint8), mode='L')
    if feather > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather))
        
    img.putalpha(alpha_img)
    return img

def fade_bottom_alpha(img, fade_px=140):
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    alpha = arr[:, :, 3]
    for i in range(fade_px):
        y = h - fade_px + i
        factor = (i / fade_px) ** 1.5
        alpha[y, :] *= (1.0 - factor)
    arr[:, :, 3] = alpha
    return Image.fromarray(arr.astype(np.uint8))

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
    for r in range(radius, 0, -12):
        alpha = int(max_alpha * (1.0 - (r / radius) ** 0.8))
        glow_draw.ellipse(
            [(cx - r, cy - r), (cx + r, cy + r)],
            fill=(color[0], color[1], color[2], alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    base_img.alpha_composite(glow)

def add_drop_shadow(canvas, box, radius, shadow_color=(0, 0, 0, 160), blur=35, offset=(0, 20)):
    x0, y0, x1, y1 = box
    shadow_layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    sx0 = x0 + offset[0]
    sy0 = y0 + offset[1]
    sx1 = x1 + offset[0]
    sy1 = y1 + offset[1]
    s_draw.rounded_rectangle([(sx0, sy0), (sx1, sy1)], radius=radius, fill=shadow_color)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow_layer)

def draw_map_hotel_pins(screen_img):
    # screen_img is RGBA
    draw = ImageDraw.Draw(screen_img)
    font_pin = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
    font_pin_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    
    # List of hotel pins across Delhi / map area
    pins = [
        {"x": 190, "y": 560, "text": "₹4,899", "label": "Luxury Suite", "type": "hotel", "featured": False},
        {"x": 420, "y": 620, "text": "₹6,500", "label": "Pool Villa", "type": "villa", "featured": True},
        {"x": 160, "y": 740, "text": "₹2,999", "label": "Campervan", "type": "rv", "featured": False},
        {"x": 350, "y": 830, "text": "₹3,750", "label": "Boutique Stay", "type": "hotel", "featured": False},
        {"x": 510, "y": 920, "text": "₹5,200", "label": "Heritage Haveli", "type": "villa", "featured": False},
        {"x": 200, "y": 1040, "text": "₹7,999", "label": "Private Pool Villa", "type": "villa", "featured": False},
        {"x": 440, "y": 1150, "text": "₹2,499", "label": "Scenic Campsite", "type": "rv", "featured": False},
        {"x": 180, "y": 1260, "text": "₹4,100", "label": "Modern Homestay", "type": "hotel", "featured": False},
        {"x": 470, "y": 1330, "text": "₹8,500", "label": "Lakeview Resort", "type": "villa", "featured": False},
    ]
    
    for p in pins:
        px, py = p["x"], p["y"]
        is_feat = p.get("featured", False)
        
        # Measure text
        bbox = draw.textbbox((0, 0), p["text"], font=font_pin)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        
        pad_x = 24 if not is_feat else 28
        pad_y = 12 if not is_feat else 16
        pw = tw + pad_x * 2 + 28  # space for icon
        ph = th + pad_y * 2
        
        # Colors
        if is_feat:
            bg_col = (99, 102, 241, 255)      # Indigo
            border_col = (165, 180, 252, 255)
            txt_col = (255, 255, 255, 255)
            icon_col = (255, 215, 0, 255)
        else:
            bg_col = (255, 255, 255, 250)      # Clean white
            border_col = (203, 213, 225, 220)  # Slate
            txt_col = (15, 23, 42, 255)        # Dark
            icon_col = (99, 102, 241, 255)     # Indigo icon
            
        # Draw drop shadow for pin
        shadow_layer = Image.new('RGBA', screen_img.size, (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow_layer)
        s_draw.rounded_rectangle([(px - pw//2, py - ph//2), (px + pw//2, py + ph//2)], radius=ph//2, fill=(0, 0, 0, 120))
        # Triangle pointer shadow
        s_draw.polygon([(px - 8, py + ph//2 - 2), (px + 8, py + ph//2 - 2), (px, py + ph//2 + 9)], fill=(0, 0, 0, 120))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8))
        screen_img.alpha_composite(shadow_layer)
        
        # Redraw on screen
        draw = ImageDraw.Draw(screen_img)
        # Rounded pill
        bx0, by0 = px - pw//2, py - ph//2
        bx1, by1 = px + pw//2, py + ph//2
        draw.rounded_rectangle([(bx0, by0), (bx1, by1)], radius=ph//2, fill=bg_col, outline=border_col, width=2)
        # Pointer tip
        draw.polygon([(px - 8, by1 - 2), (px + 8, by1 - 2), (px, by1 + 9)], fill=bg_col)
        draw.line([(px - 8, by1 - 2), (px, by1 + 9)], fill=border_col, width=2)
        draw.line([(px + 8, by1 - 2), (px, by1 + 9)], fill=border_col, width=2)
        
        # Small icon on left
        ix = bx0 + 16
        iy = py
        # Draw little icon
        if p["type"] == "villa":
            # Little house / villa
            draw.polygon([(ix, iy - 6), (ix + 7, iy - 12), (ix + 14, iy - 6)], fill=icon_col)
            draw.rectangle([(ix + 2, iy - 6), (ix + 12, iy + 6)], fill=icon_col)
            draw.rectangle([(ix + 5, iy), (ix + 9, iy + 6)], fill=bg_col)
        elif p["type"] == "rv":
            # Little campervan
            draw.rounded_rectangle([(ix, iy - 6), (ix + 14, iy + 4)], radius=2, fill=icon_col)
            draw.ellipse([(ix + 2, iy + 4), (ix + 6, iy + 8)], fill=(30, 40, 50, 255))
            draw.ellipse([(ix + 8, iy + 4), (ix + 12, iy + 8)], fill=(30, 40, 50, 255))
        else:
            # Hotel bed / building
            draw.rectangle([(ix, iy - 8), (ix + 12, iy + 6)], fill=icon_col)
            draw.rectangle([(ix + 3, iy - 5), (ix + 5, iy - 2)], fill=bg_col)
            draw.rectangle([(ix + 7, iy - 5), (ix + 9, iy - 2)], fill=bg_col)
            draw.rectangle([(ix + 3, iy), (ix + 5, iy + 3)], fill=bg_col)
            draw.rectangle([(ix + 7, iy), (ix + 9, iy + 3)], fill=bg_col)
            
        # Text
        draw.text((bx0 + 38, by0 + pad_y - 2), p["text"], font=font_pin, fill=txt_col)
        
        # If featured, add a badge above
        if is_feat:
            feat_w = 160
            feat_h = 28
            fx0 = px - feat_w // 2
            fy0 = by0 - feat_h - 6
            draw.rounded_rectangle([(fx0, fy0), (fx0 + feat_w, fy0 + feat_h)], radius=14, fill=(15, 23, 42, 240), outline=(255, 215, 0, 200), width=1)
            # Draw tiny gold star
            sx, sy = fx0 + 18, fy0 + feat_h // 2
            r_out, r_in = 6, 2.5
            star_pts = []
            for i in range(10):
                r = r_out if i % 2 == 0 else r_in
                ang = i * math.pi / 5 - math.pi / 2
                star_pts.append((sx + r * math.cos(ang), sy + r * math.sin(ang)))
            draw.polygon(star_pts, fill=(255, 215, 0, 255))
            draw.text((fx0 + 28, fy0 + 4), "4.9 • Top Rated", font=font_pin_sub, fill=(255, 215, 0, 255))

def make_phone_mockup(app_screenshot_path, target_width=780, target_height=1620, corner_radius=56, is_map=False):
    raw_img = Image.open(app_screenshot_path).convert('RGBA')
    rw, rh = raw_img.size

    # Crop status bar (~65px) and bottom nav (~40px)
    crop_top = int(rh * 0.042)
    crop_bottom = int(rh * 0.025)
    cropped = raw_img.crop((0, crop_top, rw, rh - crop_bottom))

    # Inner screen size
    bezel = 12
    screen_w = target_width - (bezel * 2)
    screen_h = target_height - (bezel * 2)

    screen_resized = cropped.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    # If map screen, draw hotel pins directly on the map!
    if is_map:
        draw_map_hotel_pins(screen_resized)

    screen_mask = create_rounded_mask((screen_w, screen_h), corner_radius - 8)
    screen_with_alpha = Image.new('RGBA', (screen_w, screen_h), (0, 0, 0, 0))
    screen_with_alpha.paste(screen_resized, (0, 0), screen_mask)

    # Chassis
    phone = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(phone)

    p_draw.rounded_rectangle([(0, 0), (target_width, target_height)], radius=corner_radius, fill=(28, 30, 36, 255))
    p_draw.rounded_rectangle([(2, 2), (target_width - 2, target_height - 2)], radius=corner_radius - 2, outline=(85, 95, 115, 220), width=2)
    p_draw.rounded_rectangle([(bezel - 2, bezel - 2), (target_width - bezel + 2, target_height - bezel + 2)], radius=corner_radius - 6, fill=(15, 17, 20, 255))

    phone.paste(screen_with_alpha, (bezel, bezel), screen_with_alpha)

    # Punch hole camera
    cam_cx = target_width // 2
    cam_cy = bezel + 24
    cam_r = 11
    p_draw.ellipse([(cam_cx - cam_r, cam_cy - cam_r), (cam_cx + cam_r, cam_cy + cam_r)], fill=(8, 8, 10, 255))
    p_draw.ellipse([(cam_cx - 4, cam_cy - 4), (cam_cx + 4, cam_cy + 4)], fill=(25, 35, 60, 220))

    # Glass highlight reflection
    glass = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glass)
    g_draw.polygon([(0, 0), (target_width * 0.75, 0), (0, target_height * 0.45)], fill=(255, 255, 255, 14))
    phone = Image.alpha_composite(phone, glass)

    return phone

def draw_insta_pill_badge(canvas, center_x, y, text, font, bg_color, border_color, text_color):
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
    b_draw.rounded_rectangle([(bx0, by0), (bx1, by1)], radius=bh // 2, fill=bg_color, outline=border_color, width=2)
    b_draw.text((bx0 + pad_h, by0 + pad_v - 2), text, font=font, fill=text_color)
    canvas.alpha_composite(badge_img)
    return by1

def generate_clean_showcase(config):
    width = 1080
    height = 2280
    
    canvas = Image.new('RGBA', (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(canvas)
    
    # 1. Background Gradient
    draw_linear_gradient(draw, width, height, config['bg_start'], config['bg_mid'], config['bg_end'])
    
    # 2. Glowing atmospheric orbs
    draw_glow_circle(canvas, config['glow_pos1'], config['glow_radius1'], config['glow_color1'], 105)
    draw_glow_circle(canvas, config['glow_pos2'], config['glow_radius2'], config['glow_color2'], 85)
    
    # Fonts
    font_pill = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
    font_head = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 64)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 32)
    
    # 3. Top Pill Badge (Clean category tag)
    pill_y = 110
    pill_end_y = draw_insta_pill_badge(
        canvas, width // 2, pill_y, 
        config['badge_text'], font_pill, 
        bg_color=config['badge_bg'], 
        border_color=config['badge_border'],
        text_color=config['badge_color']
    )
    
    # 4. Clean, impactful headline (NO fluff text)
    t_draw = ImageDraw.Draw(canvas)
    line1 = config['headline_1']
    line2 = config['headline_2']
    
    b1 = t_draw.textbbox((0, 0), line1, font=font_head)
    b2 = t_draw.textbbox((0, 0), line2, font=font_head)
    
    head_y = pill_end_y + 38
    x1 = (width - (b1[2] - b1[0])) // 2
    x2 = (width - (b2[2] - b2[0])) // 2
    
    t_draw.text((x1, head_y), line1, font=font_head, fill=(255, 255, 255, 255))
    t_draw.text((x2, head_y + 76), line2, font=font_head, fill=config['accent_color'])
    
    # 5. Clean subtitle
    sub_text = config['subtitle']
    b_sub = t_draw.textbbox((0, 0), sub_text, font=font_sub)
    x_sub = (width - (b_sub[2] - b_sub[0])) // 2
    sub_y = head_y + 170
    t_draw.text((x_sub, sub_y), sub_text, font=font_sub, fill=(210, 220, 240, 255))
    
    # 6. Phone Mockup
    mockup_w = 780
    mockup_h = 1620
    is_map = config.get('is_map', False)
    phone = make_phone_mockup(config['screenshot_path'], target_width=mockup_w, target_height=mockup_h, corner_radius=58, is_map=is_map)
    
    phone_x = (width - mockup_w) // 2
    phone_y = 660
    
    # Add deep shadow behind phone
    add_drop_shadow(
        canvas, 
        (phone_x, phone_y, phone_x + mockup_w, phone_y + mockup_h), 
        radius=58, 
        shadow_color=(0, 0, 0, 190), 
        blur=48, 
        offset=(0, 26)
    )
    
    # Paste Phone Mockup
    canvas.paste(phone, (phone_x, phone_y), phone)
    
    # 7. Real AI Photorealistic Character Cutout Overlapping
    char_raw_path = config.get('character_path')
    if char_raw_path and os.path.exists(char_raw_path):
        print(f"Cutting out character from {char_raw_path}...")
        char_cutout = cutout_exterior_white(char_raw_path, tolerance=32, feather=2)
        char_cutout = fade_bottom_alpha(char_cutout, fade_px=140)
        
        char_w, char_h = config['char_size']
        char_resized = char_cutout.resize((char_w, char_h), Image.Resampling.LANCZOS)
        cx, cy = config['char_pos']
        
        # Soft drop shadow behind character for popping 3D effect
        char_shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        cs_mask = char_resized.split()[3]
        char_shadow.paste(Image.new('RGBA', (char_w, char_h), (0, 0, 0, 185)), (cx + 12, cy + 22), cs_mask)
        char_shadow = char_shadow.filter(ImageFilter.GaussianBlur(26))
        canvas.alpha_composite(char_shadow)
        
        # Paste Real Character
        canvas.paste(char_resized, (cx, cy), char_resized)
        
    # Save final output
    out_path = config['output_path']
    canvas.convert('RGB').save(out_path, 'PNG', quality=98)
    print(f"Saved Clean Showcase: {out_path}")

def main():
    desktop_dir = r"C:\Users\Hp\Desktop\stay q"
    brain_dir = r"C:\Users\Hp\.gemini\antigravity\brain\c870c172-2cc5-4b0b-9236-8df297f10ce2"
    
    configs = [
        # SHOWCASE 1: Home / Explore Screen (Desi Traveler Girl Thumbs-Up)
        {
            'screenshot_path': os.path.join(desktop_dir, "WhatsApp Image 2026-09-22 at 4.31.48 PM.jpeg"),
            'output_path': os.path.join(desktop_dir, "showcase_1.png"),
            'bg_start': (6, 12, 30),
            'bg_mid': (12, 28, 64),
            'bg_end': (8, 42, 75),
            'glow_pos1': (200, 430),
            'glow_radius1': 500,
            'glow_color1': (0, 205, 255),
            'glow_pos2': (880, 1350),
            'glow_radius2': 560,
            'glow_color2': (35, 110, 255),
            'badge_text': "STAYS & RETREATS",
            'badge_bg': (0, 180, 255, 45),
            'badge_border': (0, 215, 255, 140),
            'badge_color': (140, 235, 255, 255),
            'headline_1': "Find Unique Stays",
            'headline_2': "Handpicked For You",
            'accent_color': (255, 210, 0, 255),
            'subtitle': "Villas, cottages, cabins and boutique homestays",
            'character_path': os.path.join(brain_dir, "indian_traveler_girl_1790076424074.jpg"),
            'char_size': (490, 650),
            'char_pos': (590, 720),
        },
        # SHOWCASE 2: Luxury Campervans (Desi Adventurer Guy with Camping Mug)
        {
            'screenshot_path': os.path.join(desktop_dir, "c2a835b9-17c9-478e-9bae-41640344adc7.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_2.png"),
            'bg_start': (4, 22, 16),
            'bg_mid': (9, 44, 32),
            'bg_end': (15, 68, 50),
            'glow_pos1': (240, 410),
            'glow_radius1': 500,
            'glow_color1': (16, 225, 150),
            'glow_pos2': (850, 1400),
            'glow_radius2': 530,
            'glow_color2': (0, 180, 120),
            'badge_text': "CAMPERVANS & RVs",
            'badge_bg': (16, 185, 129, 50),
            'badge_border': (16, 225, 150, 140),
            'badge_color': (160, 255, 215, 255),
            'headline_1': "Campervans on Rent",
            'headline_2': "Travel On Your Terms",
            'accent_color': (74, 222, 128, 255),
            'subtitle': "Queen bed, AC, kitchenette & washroom on wheels",
            'character_path': os.path.join(brain_dir, "indian_campervan_guy_1790076451460.jpg"),
            'char_size': (490, 650),
            'char_pos': (590, 720),
        },
        # SHOWCASE 3: Qube AI Concierge (Desi Tech AI Concierge Woman)
        {
            'screenshot_path': os.path.join(desktop_dir, "WhatsApp Image 2026-09-22 at 4.31.48 PM (1).jpeg"),
            'output_path': os.path.join(desktop_dir, "showcase_3.png"),
            'bg_start': (12, 6, 32),
            'bg_mid': (30, 14, 64),
            'bg_end': (52, 22, 100),
            'glow_pos1': (220, 420),
            'glow_radius1': 500,
            'glow_color1': (190, 90, 255),
            'glow_pos2': (860, 1320),
            'glow_radius2': 520,
            'glow_color2': (240, 100, 220),
            'badge_text': "AI TRIP PLANNER",
            'badge_bg': (168, 85, 247, 50),
            'badge_border': (200, 140, 255, 140),
            'badge_color': (235, 210, 255, 255),
            'headline_1': "Qube AI Concierge",
            'headline_2': "Smart Travel Assistant",
            'accent_color': (220, 185, 255, 255),
            'subtitle': "Custom day-by-day itineraries and roadtrip guides",
            'character_path': os.path.join(brain_dir, "indian_qube_concierge_1790076608412.jpg"),
            'char_size': (490, 650),
            'char_pos': (590, 720),
        },
        # SHOWCASE 4: Interactive Map Discovery (Desi Vacation Explorer Woman)
        {
            'screenshot_path': os.path.join(desktop_dir, "1c4bcf4f-4891-47c4-b7fa-eae1bc0f2d2f.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_4.png"),
            'is_map': True,
            'bg_start': (6, 20, 40),
            'bg_mid': (12, 38, 72),
            'bg_end': (18, 62, 108),
            'glow_pos1': (220, 420),
            'glow_radius1': 500,
            'glow_color1': (35, 170, 255),
            'glow_pos2': (850, 1380),
            'glow_radius2': 520,
            'glow_color2': (0, 220, 255),
            'badge_text': "MAP SEARCH",
            'badge_bg': (14, 165, 233, 50),
            'badge_border': (60, 195, 255, 140),
            'badge_color': (190, 235, 255, 255),
            'headline_1': "Explore on the Map",
            'headline_2': "Find Nearby Stays",
            'accent_color': (56, 189, 248, 255),
            'subtitle': "Browse pool villas, stays and RV campsites by location",
            'character_path': os.path.join(brain_dir, "indian_map_explorer_1790076670129.jpg"),
            'char_size': (490, 650),
            'char_pos': (590, 720),
        },
        # SHOWCASE 5: Host Portal & Dashboard (Desi Elegant Host Woman with Keys)
        {
            'screenshot_path': os.path.join(desktop_dir, "2cc34240-a2a3-41fe-a0de-c357a71c7235.jpg"),
            'output_path': os.path.join(desktop_dir, "showcase_5.png"),
            'bg_start': (20, 15, 6),
            'bg_mid': (42, 30, 12),
            'bg_end': (68, 48, 16),
            'glow_pos1': (240, 420),
            'glow_radius1': 500,
            'glow_color1': (250, 175, 30),
            'glow_pos2': (850, 1380),
            'glow_radius2': 520,
            'glow_color2': (255, 205, 70),
            'badge_text': "HOST DASHBOARD",
            'badge_bg': (234, 179, 8, 50),
            'badge_border': (252, 211, 30, 140),
            'badge_color': (254, 242, 145, 255),
            'headline_1': "Host Your Space",
            'headline_2': "Manage Stays & Bookings",
            'accent_color': (250, 204, 21, 255),
            'subtitle': "Calendar sync, reservation requests and fast bank payouts",
            'character_path': os.path.join(brain_dir, "indian_superhost_owner_1790076704058.jpg"),
            'char_size': (490, 650),
            'char_pos': (590, 720),
        }
    ]
    
    for cfg in configs:
        generate_clean_showcase(cfg)
    print("All 5 clean showcase graphics generated successfully!")

if __name__ == "__main__":
    main()
