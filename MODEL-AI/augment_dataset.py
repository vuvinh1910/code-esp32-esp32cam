"""
Tang so luong anh cho dataset tu bo anh goc.

Muc tieu dung cho bai toan 3 class:
- xuong_rong
- nha_dam
- bac_ha

Cach dung:
1) Bo anh goc vao:
   dataset/
     xuong_rong/
     nha_dam/
     bac_ha/
2) Moi class toi thieu 10 anh goc (ban co the dung it hon, nhung 10 la nen co)
3) Chay:
   python augment_dataset.py --target-per-class 200
"""

import argparse
import os
import random
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

DATASET_DIR = Path("dataset")
EXPECTED_CLASSES = ["xuong_rong", "nha_dam", "bac_ha"]
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def list_images(folder: Path):
    return [
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
    ]


def load_image(image_path: Path, img_size=(224, 224)):
    return Image.open(image_path).convert("RGB").resize(img_size)


def random_augment(img: Image.Image) -> Image.Image:
    # Rotation
    angle = random.uniform(-25, 25)
    img = img.rotate(angle, resample=Image.Resampling.BICUBIC, fillcolor=(0, 0, 0))

    # Random horizontal flip
    if random.random() < 0.5:
        img = ImageOps.mirror(img)

    # Brightness and contrast jitter
    brightness = random.uniform(0.75, 1.25)
    contrast = random.uniform(0.8, 1.2)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Contrast(img).enhance(contrast)

    # Slight random crop then resize back
    w, h = img.size
    crop_ratio = random.uniform(0.85, 1.0)
    new_w = int(w * crop_ratio)
    new_h = int(h * crop_ratio)
    left = random.randint(0, w - new_w)
    top = random.randint(0, h - new_h)
    img = img.crop((left, top, left + new_w, top + new_h)).resize((w, h), Image.Resampling.BICUBIC)

    return img


def augment_class_folder(class_folder: Path, target_per_class: int, img_size=(224, 224)):
    images = list_images(class_folder)
    if len(images) == 0:
        raise ValueError(f"Khong co anh trong thu muc: {class_folder}")

    if len(images) >= target_per_class:
        print(f"[{class_folder.name}] Da co {len(images)} anh >= muc tieu {target_per_class}, bo qua.")
        return

    to_generate = target_per_class - len(images)
    print(f"[{class_folder.name}] Anh goc: {len(images)} | Can tao them: {to_generate}")

    generated = 0
    source_idx = 0

    # Tao luan phien tu anh goc cho den khi du so luong.
    while generated < to_generate:
        src_path = images[source_idx % len(images)]
        source_idx += 1

        img = load_image(src_path, img_size=img_size)
        aug_img = random_augment(img)
        out_name = f"aug_{src_path.stem}_{generated + 1:04d}.jpg"
        aug_img.save(class_folder / out_name, format="JPEG", quality=92)
        generated += 1

    total = len(list_images(class_folder))
    print(f"[{class_folder.name}] Hoan tat. Tong so anh hien tai: {total}")


def validate_structure():
    if not DATASET_DIR.exists():
        raise FileNotFoundError(
            "Khong tim thay thu muc dataset/. Hay tao truoc roi bo anh vao."
        )

    missing = [c for c in EXPECTED_CLASSES if not (DATASET_DIR / c).exists()]
    if missing:
        raise FileNotFoundError(
            "Thieu thu muc class: " + ", ".join(missing)
        )


def main():
    parser = argparse.ArgumentParser(description="Tang anh dataset bang augmentation")
    parser.add_argument(
        "--target-per-class",
        type=int,
        default=200,
        help="Tong so anh mong muon cho moi class sau khi tang cuong",
    )
    parser.add_argument(
        "--img-size",
        type=int,
        default=224,
        help="Kich thuoc anh resize vuong, mac dinh 224",
    )
    args = parser.parse_args()

    if args.target_per_class <= 0:
        raise ValueError("target-per-class phai > 0")

    validate_structure()

    print("Bat dau tang cuong dataset...")
    for class_name in EXPECTED_CLASSES:
        class_folder = DATASET_DIR / class_name
        augment_class_folder(
            class_folder=class_folder,
            target_per_class=args.target_per_class,
            img_size=(args.img_size, args.img_size),
        )

    print("Hoan tat tat ca class.")


if __name__ == "__main__":
    main()
