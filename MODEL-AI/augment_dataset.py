import argparse
import random
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

# ===== CONFIG =====
TRAIN_DIR = Path("dataset/train")   # bạn đã chia sẵn
OUTPUT_DIR = TRAIN_DIR  # lưu ảnh tăng cường ngay trong thư mục gốc

EXPECTED_CLASSES = ["xuong_rong", "nha_dam", "tia_to"]
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


# ===== UTILS =====
def list_images(folder: Path):
    return [
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
    ]


def load_image(image_path: Path, img_size=(224, 224)):
    return Image.open(image_path).convert("RGB").resize(img_size)


# ===== AUGMENT =====
def random_augment(img: Image.Image) -> Image.Image:
    # Rotation nhẹ
    angle = random.uniform(-15, 15)
    img = img.rotate(angle, resample=Image.Resampling.BICUBIC)

    # Flip ngang
    if random.random() < 0.5:
        img = ImageOps.mirror(img)

    # Brightness / contrast nhẹ
    brightness = random.uniform(0.85, 1.15)
    contrast = random.uniform(0.85, 1.15)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Contrast(img).enhance(contrast)

    # Crop nhẹ
    w, h = img.size
    crop_ratio = random.uniform(0.9, 1.0)
    new_w = int(w * crop_ratio)
    new_h = int(h * crop_ratio)
    left = random.randint(0, w - new_w)
    top = random.randint(0, h - new_h)
    img = img.crop((left, top, left + new_w, top + new_h)).resize((w, h))

    return img


# ===== COPY + AUGMENT =====
def prepare_and_augment(target_per_class=200, img_size=(224, 224)):
    print("Dang xu ly train dataset...")

    for class_name in EXPECTED_CLASSES:
        src_folder = TRAIN_DIR / class_name
        dst_folder = OUTPUT_DIR / class_name

        dst_folder.mkdir(parents=True, exist_ok=True)

        images = list_images(src_folder)

        print(f"{class_name}: {len(images)} anh goc")

        if not images:
            print(f"{class_name}: bo qua vi khong co anh goc")
            continue

        # Augment
        to_generate = target_per_class - len(images)
        if to_generate <= 0:
            continue

        print(f"{class_name}: tao them {to_generate} anh")

        generated = 0
        idx = 0

        while generated < to_generate:
            src = images[idx % len(images)]
            idx += 1

            img = load_image(src, img_size)
            aug = random_augment(img)

            out_name = f"aug_{src.stem}_{generated+1:04d}.jpg"
            aug.save(dst_folder / out_name, quality=92)

            generated += 1


# ===== MAIN =====
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=200)
    parser.add_argument("--img-size", type=int, default=224)
    args = parser.parse_args()

    prepare_and_augment(
        target_per_class=args.target,
        img_size=(args.img_size, args.img_size)
    )

    print("\nHoan tat!")
    print("-> Anh augment da duoc luu truc tiep trong 'dataset/train'")
    print("-> Test giu nguyen folder dataset/test")


if __name__ == "__main__":
    main()