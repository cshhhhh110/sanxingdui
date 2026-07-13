from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import math
import os

def add_noise_texture(img, intensity=0.15):
    """添加噪点纹理，模拟真实照片的颗粒感"""
    pixels = img.load()
    width, height = img.size

    for i in range(0, width, 2):
        for j in range(0, height, 2):
            r, g, b = pixels[i, j]
            noise = random.randint(-int(20*intensity), int(20*intensity))
            pixels[i, j] = (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise))
            )
    return img

def add_vignette(img, strength=0.6):
    """添加暗角效果，增强真实感"""
    width, height = img.size
    vignette = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(vignette)

    center_x, center_y = width // 2, height // 2
    max_dist = math.sqrt(center_x**2 + center_y**2)

    for y in range(height):
        for x in range(width):
            dist = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            factor = 1 - (dist / max_dist) * strength
            factor = max(0, min(1, factor))

            r, g, b = img.getpixel((x, y))
            new_r = int(r * factor)
            new_g = int(g * factor)
            new_b = int(b * factor)
            vignette.putpixel((x, y), (new_r, new_g, new_b))

    return vignette

def create_soil_texture(width, height, base_color):
    """创建土壤纹理"""
    img = Image.new('RGB', (width, height), base_color)
    pixels = img.load()

    # 添加不规则的土壤色块
    for _ in range(200):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        size = random.randint(50, 200)
        color_var = random.randint(-30, 30)

        for dx in range(-size, size):
            for dy in range(-size, size):
                if 0 <= x + dx < width and 0 <= y + dy < height:
                    dist = math.sqrt(dx*dx + dy*dy)
                    if dist < size:
                        r, g, b = base_color
                        pixels[x + dx, y + dy] = (
                            max(0, min(255, r + color_var)),
                            max(0, min(255, g + color_var)),
                            max(0, min(255, b + color_var))
                        )

    return img

def create_excavation_scene(width, height, scene_type):
    """根据场景类型创建考古场景"""

    if scene_type == 'entrance':
        # 遗址入口：草地+天空
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        # 天空渐变 (上浅下深)
        for y in range(height // 2):
            ratio = y / (height // 2)
            color = (
                int(135 + (180 - 135) * ratio),
                int(206 + (220 - 206) * ratio),
                int(235 + (240 - 235) * ratio)
            )
            draw.line([(0, y), (width, y)], fill=color)

        # 草地 (绿色到棕色渐变)
        for y in range(height // 2, height):
            ratio = (y - height // 2) / (height // 2)
            color = (
                int(80 + (60 - 80) * ratio),
                int(120 + (90 - 120) * ratio),
                int(60 + (50 - 60) * ratio)
            )
            draw.line([(0, y), (width, y)], fill=color)

        # 添加树木剪影
        for i in range(10):
            x = random.randint(0, width)
            tree_height = random.randint(200, 400)
            tree_width = random.randint(60, 120)
            draw.ellipse([x - tree_width//2, height//2 - tree_height,
                         x + tree_width//2, height//2 + 50],
                        fill=(40, 60, 30))

    elif scene_type == 'pit':
        # 祭祀坑：土坑+网格
        img = create_soil_texture(width, height, (80, 65, 50))
        draw = ImageDraw.Draw(img)

        # 绘制坑边缘
        pit_margin = 200
        draw.rectangle([pit_margin, height//3, width - pit_margin, 2*height//3],
                      outline=(50, 40, 30), width=10)

        # 绘制测绘网格
        grid_size = 100
        for x in range(pit_margin, width - pit_margin, grid_size):
            draw.line([(x, height//3), (x, 2*height//3)], fill=(100, 85, 70), width=2)
        for y in range(height//3, 2*height//3, grid_size):
            draw.line([(pit_margin, y), (width - pit_margin, y)], fill=(100, 85, 70), width=2)

        # 添加随机的"文物碎片"（深色斑点）
        for _ in range(30):
            x = random.randint(pit_margin + 50, width - pit_margin - 50)
            y = random.randint(height//3 + 50, 2*height//3 - 50)
            size = random.randint(10, 30)
            draw.ellipse([x - size, y - size, x + size, y + size],
                        fill=(40, 30, 20))

    elif scene_type == 'pit_tree':
        # 青铜神树场景：更大的坑，中央有神树轮廓
        img = create_soil_texture(width, height, (70, 60, 45))
        draw = ImageDraw.Draw(img)

        # 大型坑位
        pit_margin = 150
        draw.rectangle([pit_margin, height//4, width - pit_margin, 3*height//4],
                      outline=(45, 35, 25), width=15)

        # 中央绘制简化的"青铜神树"轮廓
        tree_x = width // 2
        tree_y = height // 2

        # 树干
        draw.rectangle([tree_x - 30, tree_y - 150, tree_x + 30, tree_y + 150],
                      fill=(60, 80, 50), outline=(40, 60, 30), width=3)

        # 树枝
        for i in range(-3, 4):
            branch_y = tree_y + i * 60
            draw.line([(tree_x - 30, branch_y), (tree_x - 120, branch_y - 40)],
                     fill=(50, 70, 40), width=8)
            draw.line([(tree_x + 30, branch_y), (tree_x + 120, branch_y - 40)],
                     fill=(50, 70, 40), width=8)

    elif scene_type == 'lab':
        # 实验室：冷色调，干净背景
        img = Image.new('RGB', (width, height), (95, 95, 100))
        draw = ImageDraw.Draw(img)

        # 绘制工作台
        table_y = height // 2
        draw.rectangle([200, table_y - 50, width - 200, table_y + 50],
                      fill=(140, 140, 145), outline=(80, 80, 85), width=5)

        # 绘制灯具（圆形）
        for i in range(4):
            x = 200 + (width - 400) * i // 3
            draw.ellipse([x - 60, 100, x + 60, 220],
                        fill=(220, 220, 180), outline=(180, 180, 140), width=3)

        # 添加设备剪影
        draw.rectangle([width//2 - 100, table_y - 30, width//2 + 100, table_y + 30],
                      fill=(70, 75, 80))

    elif scene_type == 'modern_pit':
        # 现代考古：透明舱+高科技
        img = create_soil_texture(width, height, (75, 70, 60))
        draw = ImageDraw.Draw(img)

        # 绘制透明保护舱框架
        cabin_margin = 250
        # 顶部弧形
        draw.arc([cabin_margin, height//4, width - cabin_margin, 3*height//4],
                0, 180, fill=(100, 150, 200), width=8)
        # 侧边支柱
        draw.rectangle([cabin_margin, height//4, cabin_margin + 15, 3*height//4],
                      fill=(80, 120, 160))
        draw.rectangle([width - cabin_margin - 15, height//4, width - cabin_margin, 3*height//4],
                      fill=(80, 120, 160))

        # LED灯带效果
        for i in range(0, width - 2*cabin_margin, 50):
            x = cabin_margin + i
            draw.ellipse([x - 5, height//4 - 10, x + 5, height//4 + 10],
                        fill=(180, 200, 255))

    elif scene_type == 'jinsha':
        # 金沙遗址：金黄色调
        img = create_soil_texture(width, height, (100, 85, 55))
        draw = ImageDraw.Draw(img)

        # 绘制祭祀坑
        draw.ellipse([width//4, height//3, 3*width//4, 2*height//3],
                    outline=(70, 60, 40), width=12)

        # 添加"金器"光泽点
        for _ in range(15):
            x = random.randint(width//4 + 50, 3*width//4 - 50)
            y = random.randint(height//3 + 50, 2*height//3 - 50)
            size = random.randint(5, 15)
            draw.ellipse([x - size, y - size, x + size, y + size],
                        fill=(255, 215, 0))

    elif scene_type == 'baodun':
        # 宝墩遗址：城墙遗迹
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        # 天空
        for y in range(height // 2):
            ratio = y / (height // 2)
            color = (
                int(120 + (160 - 120) * ratio),
                int(150 + (180 - 150) * ratio),
                int(180 + (200 - 180) * ratio)
            )
            draw.line([(0, y), (width, y)], fill=color)

        # 草地
        for y in range(height // 2, height):
            color = (70, 100, 60)
            draw.line([(0, y), (width, y)], fill=color)

        # 绘制城墙遗迹（土堆）
        wall_points = [
            (width//4, height//2 + 100),
            (width//4 + 100, height//2 - 50),
            (3*width//4 - 100, height//2 - 50),
            (3*width//4, height//2 + 100)
        ]
        draw.polygon(wall_points, fill=(90, 80, 60))

    elif scene_type == 'museum':
        # 博物馆：深色背景+聚光灯
        img = Image.new('RGB', (width, height), (30, 35, 40))
        draw = ImageDraw.Draw(img)

        # 绘制展柜
        for i in range(3):
            x = 200 + (width - 400) * i // 2
            # 展柜玻璃框
            draw.rectangle([x - 150, height//2 - 200, x + 150, height//2 + 200],
                          outline=(100, 100, 110), width=5)

            # 聚光灯效果（圆形渐变）
            for radius in range(150, 0, -10):
                alpha = int(255 * (1 - radius / 150))
                color = (60 + alpha // 3, 60 + alpha // 3, 50 + alpha // 3)
                draw.ellipse([x - radius, height//2 - radius,
                            x + radius, height//2 + radius],
                           fill=color)

    else:
        img = Image.new('RGB', (width, height), (60, 60, 60))

    return img

def create_advanced_panorama(width, height, scene_config, filename):
    """创建高级全景图"""
    print(f"[生成中] {scene_config['title']}...")

    # 创建基础场景
    img = create_excavation_scene(width, height, scene_config['scene_type'])

    # 添加噪点纹理
    img = add_noise_texture(img, 0.1)

    # 应用轻微模糊（模拟景深）
    img = img.filter(ImageFilter.GaussianBlur(radius=1))

    # 添加暗角效果
    img = add_vignette(img, 0.4)

    draw = ImageDraw.Draw(img)

    # 添加文字标题
    center_x = width // 2
    center_y = height // 2

    try:
        title_font = ImageFont.truetype("msyh.ttc", 100)
        subtitle_font = ImageFont.truetype("msyh.ttc", 50)
    except:
        try:
            title_font = ImageFont.truetype("arial.ttf", 100)
            subtitle_font = ImageFont.truetype("arial.ttf", 50)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()

    # 绘制半透明背景框
    title_bbox = draw.textbbox((0, 0), scene_config['title'], font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_height = title_bbox[3] - title_bbox[1]

    subtitle_bbox = draw.textbbox((0, 0), scene_config['subtitle'], font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_height = subtitle_bbox[3] - subtitle_bbox[1]

    box_padding = 60
    box_width = max(title_width, subtitle_width) + box_padding * 2
    box_height = title_height + subtitle_height + box_padding * 3

    box_left = center_x - box_width // 2
    box_top = center_y - box_height // 2
    box_right = center_x + box_width // 2
    box_bottom = center_y + box_height // 2

    # 背景框（带圆角和阴影效果）
    shadow_offset = 8
    draw.rounded_rectangle(
        [box_left + shadow_offset, box_top + shadow_offset,
         box_right + shadow_offset, box_bottom + shadow_offset],
        radius=15,
        fill=(0, 0, 0)
    )
    draw.rounded_rectangle(
        [box_left, box_top, box_right, box_bottom],
        radius=15,
        fill=(20, 20, 20, 200),
        outline=(214, 179, 95),
        width=3
    )

    # 绘制标题
    title_x = center_x - title_width // 2
    title_y = center_y - box_height // 4
    draw.text((title_x, title_y), scene_config['title'],
             fill=(214, 179, 95), font=title_font)

    # 绘制副标题
    subtitle_x = center_x - subtitle_width // 2
    subtitle_y = title_y + title_height + 30
    draw.text((subtitle_x, subtitle_y), scene_config['subtitle'],
             fill=(180, 160, 120), font=subtitle_font)

    # 添加装饰线条
    line_y = box_top + 30
    draw.line([box_left + 50, line_y, box_right - 50, line_y],
             fill=(214, 179, 95), width=2)
    line_y = box_bottom - 30
    draw.line([box_left + 50, line_y, box_right - 50, line_y],
             fill=(214, 179, 95), width=2)

    # 保存
    img.save(filename, quality=90, optimize=True)
    print(f"[完成] {filename}")

# 场景配置
output_dir = r"D:\TRYTRY\人工智能大赛参赛文件夹\new\sanxingdui\vue3\public\images\archaeology\panoramas"
os.makedirs(output_dir, exist_ok=True)

scenes = [
    {
        'filename': 'scene1-entrance.jpg',
        'scene_type': 'entrance',
        'title': '三星堆遗址入口',
        'subtitle': 'Sanxingdui Site Entrance'
    },
    {
        'filename': 'scene2-pit1.jpg',
        'scene_type': 'pit',
        'title': '1号祭祀坑发掘现场',
        'subtitle': 'Sacrificial Pit No.1 Excavation'
    },
    {
        'filename': 'scene3-pit2.jpg',
        'scene_type': 'pit_tree',
        'title': '2号祭祀坑·青铜神树',
        'subtitle': 'Pit No.2 - Bronze Sacred Tree'
    },
    {
        'filename': 'scene4-lab.jpg',
        'scene_type': 'lab',
        'title': '文物清理修复室',
        'subtitle': 'Conservation Laboratory'
    },
    {
        'filename': 'scene5-pit3.jpg',
        'scene_type': 'modern_pit',
        'title': '3号祭祀坑·2021新发现',
        'subtitle': 'Pit No.3 - New Discovery 2021'
    },
    {
        'filename': 'scene6-jinsha.jpg',
        'scene_type': 'jinsha',
        'title': '金沙遗址祭祀区',
        'subtitle': 'Jinsha Site Ritual Area'
    },
    {
        'filename': 'scene7-baodun.jpg',
        'scene_type': 'baodun',
        'title': '宝墩遗址·史前聚落',
        'subtitle': 'Baodun Prehistoric Settlement'
    },
    {
        'filename': 'scene8-museum.jpg',
        'scene_type': 'museum',
        'title': '三星堆博物馆展厅',
        'subtitle': 'Museum Exhibition Hall'
    }
]

print("=" * 60)
print("开始生成高级考古场景全景图")
print("=" * 60)

width = 4096
height = 2048

for scene in scenes:
    filepath = os.path.join(output_dir, scene['filename'])
    create_advanced_panorama(width, height, scene, filepath)

print("=" * 60)
print("[完成] 所有高级全景图已生成！")
print(f"保存位置: {output_dir}")
print("=" * 60)
