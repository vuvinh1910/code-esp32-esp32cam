from tensorflow.keras.preprocessing.image import ImageDataGenerator
import tensorflow as tf
import json
import os

DATASET_DIR = "dataset"
EXPECTED_CLASS_NAMES = ["xuong_rong", "nha_dam", "bac_ha"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 12


def validate_dataset_structure():
    if not os.path.isdir(DATASET_DIR):
        raise FileNotFoundError(
            f"Khong tim thay thu muc {DATASET_DIR}. Hay tao thu muc va bo anh vao truoc khi train."
        )

    missing = [
        class_name
        for class_name in EXPECTED_CLASS_NAMES
        if not os.path.isdir(os.path.join(DATASET_DIR, class_name))
    ]
    if missing:
        raise FileNotFoundError(
            "Thieu thu muc class trong dataset: " + ", ".join(missing)
        )


def build_model(num_classes: int) -> tf.keras.Model:
    base_model = tf.keras.applications.MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3),
    )
    base_model.trainable = False

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3)),
            tf.keras.layers.Rescaling(1.0 / 255.0),
            base_model,
            tf.keras.layers.GlobalAveragePooling2D(),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    validate_dataset_structure()

    train_datagen = ImageDataGenerator(
        rotation_range=20,
        horizontal_flip=True,
        zoom_range=0.2,
        validation_split=0.2,
    )
    val_datagen = ImageDataGenerator(validation_split=0.2)

    train_data = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        shuffle=True,
        seed=42,
    )

    val_data = val_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
        seed=42,
    )

    # Dung thu tu class thuc te cua flow_from_directory de tranh lech nhan.
    class_names = [None] * len(train_data.class_indices)
    for class_name, idx in train_data.class_indices.items():
        class_names[idx] = class_name

    if sorted(class_names) != sorted(EXPECTED_CLASS_NAMES):
        raise ValueError(
            "Class trong dataset khong dung yeu cau. Tim thay: "
            f"{class_names}. Yeu cau: {EXPECTED_CLASS_NAMES}."
        )

    model = build_model(num_classes=len(class_names))

    model.fit(train_data, validation_data=val_data, epochs=EPOCHS, verbose=1)
    model.save("plant_model.h5")

    with open("class_names.json", "w", encoding="utf-8") as f:
        json.dump(class_names, f, ensure_ascii=False, indent=2)

    print("Model da luu: plant_model.h5")
    print("Danh sach class da luu: class_names.json")


if __name__ == "__main__":
    main()