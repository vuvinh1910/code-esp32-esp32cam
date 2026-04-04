"""
Test script để kiểm tra model hoạt động đúng
"""
import tensorflow as tf
import numpy as np
import json
import os

# Load model
if os.path.exists("plant_model.h5") and os.path.exists("class_names.json"):
    model = tf.keras.models.load_model("plant_model.h5")
    with open("class_names.json", "r") as f:
        CLASS_NAMES = json.load(f)
    print(f"✓ Model loaded. Classes: {CLASS_NAMES}")
else:
    print("❌ Chạy train.py trước để tạo model!")
    exit()

# Test với ảnh giả
print("\n🧪 Testing predict với ảnh ngẫu nhiên...")
test_img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
test_img = np.expand_dims(test_img.astype(np.float32), axis=0)

predictions = model.predict(test_img, verbose=0)
class_idx = np.argmax(predictions[0])
confidence = predictions[0][class_idx]

print(f"\n✓ Kết quả:")
print(f"  Plant: {CLASS_NAMES[class_idx]}")
print(f"  Confidence: {confidence:.2%}")
print(f"  All scores: {dict(zip(CLASS_NAMES, predictions[0]))}")
