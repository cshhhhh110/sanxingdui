from PIL import Image, ImageDraw, ImageFont
import os

# 创建全景图（2:1比例，适合360度全景查看器）
def create_panorama(width, height, bg_color, title, subtitle, filename):
    """
    创建全景占位图
    width: 宽度（通常是高度的2倍）
    height: 高度
    bg_color: 背景颜色
    title: 主标题
    subtitle: 副标题
    filename: 输出文件名
    """
    # 创建图像
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 添加纹理效果（模拟考古场景的泥土质感）
    for i in range(0, width, 20):
        for j in range(0, height, 20):
            # 随机添加一些深色点，营造质感
            if (i + j) % 40 == 0:
                draw.rectangle([i, j, i+10, j+10], fill=tuple(max(0, c-20) for c in bg_color))

    # 绘制中心区域文字
    center_x = width // 2
    center_y = height // 2

    # 尝试使用系统字体，如果没有就使用默认字体
    try:
        title_font = ImageFont.truetype("msyh.ttc", 120)  # 微软雅黑
        subtitle_font = ImageFont.truetype("msyh.ttc", 60)
    except:
        try:
            title_font = ImageFont.truetype("arial.ttf", 120)
            subtitle_font = ImageFont.truetype("arial.ttf", 60)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()

    # 绘制半透明背景框
    box_padding = 80
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_height = title_bbox[3] - title_bbox[1]

    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_height = subtitle_bbox[3] - subtitle_bbox[1]

    box_width = max(title_width, subtitle_width) + box_padding * 2
    box_height = title_height + subtitle_height + box_padding * 3

    box_left = center_x - box_width // 2
    box_top = center_y - box_height // 2
    box_right = center_x + box_width // 2
    box_bottom = center_y + box_height // 2

    # 绘制半透明黑色背景
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle(
        [box_left, box_top, box_right, box_bottom],
        radius=20,
        fill=(0, 0, 0, 180)
    )
    img.paste(overlay, (0, 0), overlay)

    # 重新创建draw对象（因为paste后需要）
    draw = ImageDraw.Draw(img)

    # 绘制标题
    title_x = center_x - title_width // 2
    title_y = center_y - box_height // 4
    draw.text((title_x, title_y), title, fill=(214, 179, 95), font=title_font)

    # 绘制副标题
    subtitle_x = center_x - subtitle_width // 2
    subtitle_y = title_y + title_height + 40
    draw.text((subtitle_x, subtitle_y), subtitle, fill=(196, 182, 144), font=subtitle_font)

    # 添加四角装饰（考古风格的边框）
    corner_size = 100
    corner_color = (214, 179, 95)

    # 左上角
    draw.line([50, 50, 50+corner_size, 50], fill=corner_color, width=5)
    draw.line([50, 50, 50, 50+corner_size], fill=corner_color, width=5)

    # 右上角
    draw.line([width-50-corner_size, 50, width-50, 50], fill=corner_color, width=5)
    draw.line([width-50, 50, width-50, 50+corner_size], fill=corner_color, width=5)

    # 左下角
    draw.line([50, height-50, 50+corner_size, height-50], fill=corner_color, width=5)
    draw.line([50, height-50-corner_size, 50, height-50], fill=corner_color, width=5)

    # 右下角
    draw.line([width-50-corner_size, height-50, width-50, height-50], fill=corner_color, width=5)
    draw.line([width-50, height-50-corner_size, width-50, height-50], fill=corner_color, width=5)

    # 保存图像
    img.save(filename, quality=85)
    print(f"[OK] 已生成: {filename}")

# 输出目录
output_dir = r"D:\TRYTRY\人工智能大赛参赛文件夹\new\sanxingdui\vue3\public\images\archaeology\panoramas"
os.makedirs(output_dir, exist_ok=True)

# 8个场景的配置
scenes = [
    {
        'filename': 'scene1-entrance.jpg',
        'bg_color': (60, 70, 55),  # 深绿色调
        'title': '三星堆遗址入口',
        'subtitle': 'Sanxingdui Site Entrance'
    },
    {
        'filename': 'scene2-pit1.jpg',
        'bg_color': (80, 65, 50),  # 土黄色调
        'title': '1号祭祀坑发掘现场',
        'subtitle': 'Sacrificial Pit No.1'
    },
    {
        'filename': 'scene3-pit2.jpg',
        'bg_color': (70, 60, 45),  # 棕土色
        'title': '2号祭祀坑·青铜神树',
        'subtitle': 'Pit No.2 - Bronze Sacred Tree'
    },
    {
        'filename': 'scene4-lab.jpg',
        'bg_color': (95, 95, 100),  # 冷灰色
        'title': '文物清理修复室',
        'subtitle': 'Conservation Laboratory'
    },
    {
        'filename': 'scene5-pit3.jpg',
        'bg_color': (75, 70, 60),  # 现代考古棚色
        'title': '3号祭祀坑·2021新发现',
        'subtitle': 'Pit No.3 - New Discovery 2021'
    },
    {
        'filename': 'scene6-jinsha.jpg',
        'bg_color': (85, 75, 50),  # 金沙遗址色调
        'title': '金沙遗址祭祀区',
        'subtitle': 'Jinsha Site Ritual Area'
    },
    {
        'filename': 'scene7-baodun.jpg',
        'bg_color': (65, 75, 60),  # 史前遗址绿
        'title': '宝墩遗址·史前聚落',
        'subtitle': 'Baodun Site - Prehistoric Settlement'
    },
    {
        'filename': 'scene8-museum.jpg',
        'bg_color': (40, 45, 50),  # 博物馆深色
        'title': '三星堆博物馆展厅',
        'subtitle': 'Museum Exhibition Hall'
    }
]

# 生成所有全景图
print("开始生成考古全景图...")
print("=" * 50)

width = 4096  # 全景图宽度
height = 2048  # 全景图高度（2:1比例）

for scene in scenes:
    filepath = os.path.join(output_dir, scene['filename'])
    create_panorama(
        width,
        height,
        scene['bg_color'],
        scene['title'],
        scene['subtitle'],
        filepath
    )

print("=" * 50)
print("[OK] 所有全景图生成完成！")
print(f"保存位置: {output_dir}")
