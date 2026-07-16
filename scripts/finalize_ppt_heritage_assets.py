from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from pathlib import Path


CURATION = (
    ("C001", "01-cover-architecture", "01-sanxingdui-museum-aerial", "三星堆博物馆航拍", "封面 / 项目总览"),
    ("C004", "01-cover-architecture", "02-new-museum-front", "三星堆博物馆新馆正面", "封面 / 建筑介绍"),
    ("C005", "01-cover-architecture", "03-new-museum-in-forest", "林木之间的三星堆新馆", "章节页 / 建筑介绍"),
    ("C006", "01-cover-architecture", "04-red-lit-exhibition-hall", "红色光影展厅", "章节页 / 数字展陈"),
    ("C007", "01-cover-architecture", "05-new-museum-plaza", "三星堆新馆广场", "封面 / 场馆介绍"),
    ("C011", "01-cover-architecture", "06-museum-spiral-interior", "三星堆新馆旋厅", "章节页 / 场馆介绍"),
    ("C015", "01-cover-architecture", "07-museum-canyon-interior", "三星堆新馆峡谷式内部空间", "封面 / 留白排版"),
    ("C016", "01-cover-architecture", "08-museum-light-hall", "三星堆新馆光影大厅", "封面 / 留白排版"),

    ("C012", "02-iconic-artifacts", "01-bronze-mask-dark-display", "暗色展陈中的青铜面具", "核心文物 / 封面"),
    ("C017", "02-iconic-artifacts", "02-bronze-mask-pedestal", "青铜纵目面具正面展陈", "核心文物"),
    ("C021", "02-iconic-artifacts", "03-vertical-eye-mask-angle", "青铜纵目面具斜侧面", "核心文物 / 细节"),
    ("C022", "02-iconic-artifacts", "04-vertical-eye-mask-profile", "青铜纵目面具侧面", "核心文物 / 细节"),
    ("C023", "02-iconic-artifacts", "05-bronze-head-green", "青铜人头像", "核心文物"),
    ("C024", "02-iconic-artifacts", "06-gold-faced-bronze-head", "戴金面罩青铜人头像", "核心文物 / 金铜对比"),
    ("C025", "02-iconic-artifacts", "07-bronze-mask-isolated-white", "白底青铜面具", "抠图式排版 / 文物介绍"),
    ("C026", "02-iconic-artifacts", "08-giant-bronze-mask-isolated", "灰底青铜大面具", "抠图式排版 / 文物介绍"),
    ("C033", "02-iconic-artifacts", "09-bronze-bird", "三星堆青铜鸟", "核心文物 / 图腾"),
    ("C039", "02-iconic-artifacts", "10-artifact-group-display", "三星堆代表文物组合展陈", "文物体系 / 总览"),
    ("C047", "02-iconic-artifacts", "11-mask-macro-12k", "青铜面具12K微距光影", "封面 / 微距细节"),
    ("C062", "02-iconic-artifacts", "12-ritual-mask-display", "祭祀面具艺术化展陈", "封面 / 神秘氛围"),
    ("C082", "02-iconic-artifacts", "13-gold-mask-bright", "金面具明亮展陈", "核心文物 / 金器"),
    ("C083", "02-iconic-artifacts", "14-gold-mask-front", "黑底金面具正面", "封面 / 核心文物"),
    ("C090", "02-iconic-artifacts", "15-gold-mask-angle", "金面具斜侧面", "核心文物 / 细节"),
    ("C118", "02-iconic-artifacts", "16-bronze-standing-figure", "青铜大立人展陈", "核心文物 / 人物"),
    ("C119", "02-iconic-artifacts", "17-jinsha-gold-mask", "金沙金面具", "三星堆与金沙对比"),
    ("C106", "02-iconic-artifacts", "18-kneeling-figure-art-render", "扭头跪坐人像艺术渲染", "艺术表达 / 非考古原貌"),

    ("C067", "03-sacred-tree-details", "01-sacred-tree-silhouette", "青铜神树剪影式全景", "核心文物 / 章节页"),
    ("C072", "03-sacred-tree-details", "02-sacred-tree-lit-display", "青铜神树环形灯光展陈", "核心文物 / 封面"),
    ("C073", "03-sacred-tree-details", "03-sacred-tree-crown", "青铜神树树冠", "局部细节"),
    ("C074", "03-sacred-tree-details", "04-sacred-tree-branches", "青铜神树枝干", "局部细节"),
    ("C075", "03-sacred-tree-details", "05-sacred-tree-bird-detail", "青铜神树神鸟细节", "局部细节 / 图腾"),
    ("C076", "03-sacred-tree-details", "06-sacred-tree-blue-hall", "蓝色展厅中的青铜神树", "核心文物 / 封面"),
    ("C077", "03-sacred-tree-details", "07-sacred-tree-vertical", "青铜神树纵向全景", "核心文物 / 竖版"),
    ("C078", "03-sacred-tree-details", "08-sacred-tree-dragon-detail", "青铜神树龙形构件", "局部细节 / 图腾"),

    ("C027", "04-digital-immersive", "01-12k-mask-light-tunnel", "12K数字展面具光廊", "数字展 / 章节页"),
    ("C029", "04-digital-immersive", "02-digital-artifact-installation", "数字文物装置", "数字展 / 科技表达"),
    ("C032", "04-digital-immersive", "03-ancient-shu-light-tunnel", "古蜀光影沉浸通道", "数字展 / 封面"),
    ("C036", "04-digital-immersive", "04-sanxingdui-digital-poster", "三星堆数字艺术海报", "海报参考 / 视觉风格"),
    ("C048", "04-digital-immersive", "05-gold-mask-immersive-hall", "金面具沉浸式展厅", "数字展 / 科技表达"),
    ("C051", "04-digital-immersive", "06-gold-mask-light-walls", "金面具环幕光影", "数字展 / 章节页"),
    ("C053", "04-digital-immersive", "07-ancient-shu-fantasy-scene", "古蜀神树幻想场景", "数字复原 / 非考古原貌"),
    ("C060", "04-digital-immersive", "08-blue-mask-immersive-room", "蓝色面具沉浸空间", "数字展 / 封面"),

    ("C091", "05-gold-jade-patterns", "01-gold-scepter-fish-scale", "金杖鱼鳞纹细节", "纹样 / 背景"),
    ("C108", "05-gold-jade-patterns", "02-jade-blade-detail", "三星堆玉器刃部细节", "玉器 / 细节"),
    ("C109", "05-gold-jade-patterns", "03-jade-zhang-detail", "三星堆玉璋细节", "玉器 / 细节"),
    ("C110", "05-gold-jade-patterns", "04-jade-tool-detail", "三星堆玉器材质细节", "玉器 / 细节"),
    ("C121", "05-gold-jade-patterns", "05-sun-bird-ceiling", "太阳神鸟穹顶视觉", "金沙 / 封面背景"),
    ("C123", "05-gold-jade-patterns", "06-gold-band-closeup", "金沙金器环带特写", "金器 / 材质细节"),
    ("C126", "05-gold-jade-patterns", "07-gold-pattern-strips", "古蜀金器纹样条带", "纹样 / 信息图"),
    ("C127", "05-gold-jade-patterns", "08-sun-bird-symbol", "太阳神鸟金饰图形", "金沙 / 图标 / 封面"),
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pool",
        default=str(Path(tempfile.gettempdir()) / "sanxingdui-ppt-candidate-pool"),
    )
    parser.add_argument(
        "--output",
        default="vue3/public/images/ppt-heritage-assets",
    )
    args = parser.parse_args()

    pool = Path(args.pool)
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    records = json.loads((pool / "_candidates.json").read_text(encoding="utf-8"))
    by_id = {item["candidateId"]: item for item in records}
    manifest = []

    for candidate_id, category, slug, name, usage in CURATION:
        source = by_id.get(candidate_id)
        if not source:
            raise RuntimeError(f"Missing candidate: {candidate_id}")
        source_file = pool / source["file"]
        extension = source_file.suffix.lower()
        destination_dir = output / category
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / f"{slug}{extension}"
        shutil.copy2(source_file, destination)
        manifest.append(
            {
                "id": slug,
                "name": name,
                "category": category,
                "usage": usage,
                "path": destination.relative_to(output).as_posix(),
                "width": source["actualWidth"],
                "height": source["actualHeight"],
                "sourceTitle": source["title"],
                "sourcePage": source["source"],
                "imageUrl": source["image"],
                "sourceHost": source["sourceHost"],
                "candidateId": candidate_id,
                "notice": "数字复原或艺术表达，非考古原貌" if "非考古原貌" in usage else "",
            }
        )

    (output / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    lines = [
        "# 三星堆与古蜀文化 PPT 高清素材库",
        "",
        f"共 {len(manifest)} 张。已按 PPT 使用场景筛选，排除普通游客照、强反光、主体过小、明显水印和低清图片。",
        "",
        "> 素材来自公开网页与官方/专业媒体页面，仅建议用于项目汇报、教学和内部演示。公开发布或商业使用前，请根据 `sourcePage` 再确认授权。数字复原与艺术表达图片不得描述为考古原貌。",
        "",
    ]
    current_category = None
    for item in manifest:
        if item["category"] != current_category:
            current_category = item["category"]
            lines.extend((f"## {current_category}", ""))
        lines.extend(
            (
                f"### {item['name']}",
                "",
                f"![{item['name']}](./{item['path']})",
                "",
                f"- 推荐用途：{item['usage']}",
                f"- 尺寸：{item['width']} x {item['height']}",
                f"- 本地路径：`{item['path']}`",
                f"- 来源：[{item['sourceTitle']}]({item['sourcePage']})",
            )
        )
        if item["notice"]:
            lines.append(f"- 注意：{item['notice']}")
        lines.append("")
    (output / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Finalized {len(manifest)} PPT assets in {output}")


if __name__ == "__main__":
    main()
