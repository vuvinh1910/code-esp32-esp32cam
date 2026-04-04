# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
import tensorflow as tf
from PIL import Image
import numpy as np
import io
import json
import os

app = FastAPI()

# Load model được train từ train.py
MODEL_PATH = "plant_model.h5"
CLASS_NAMES_PATH = "class_names.json"

if os.path.exists(MODEL_PATH) and os.path.exists(CLASS_NAMES_PATH):
    model = tf.keras.models.load_model(MODEL_PATH)
    with open(CLASS_NAMES_PATH, "r") as f:
        CLASS_NAMES = json.load(f)
else:
    raise FileNotFoundError(f"Không tìm thấy {MODEL_PATH} hoặc {CLASS_NAMES_PATH}. Hãy chạy train.py trước!")

# Mapping loai cay -> luong nuoc goi y
PLANT_WATER_MAP = {
    "xuong_rong": "do am dat 70%",
    "nha_dam": "do am dat 50%",
    "bac_ha": "do am dat 60%",
}

@app.get("/")
def root():
    return {"message": "Plant Identification API - POST /api/ai/identify voi anh"}

@app.post("/api/ai/identify")
async def identify_plant(file: UploadFile = File(...)):
    try:
        # Đọc ảnh từ ESP32-CAM
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img = img.resize((224, 224))

        # Chuẩn bị dữ liệu
        # train.py da co Rescaling layer nen khong can chia 255 o day.
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)

        # Dự đoán
        predictions = model.predict(img_array, verbose=0)
        class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][class_idx])

        plant_name = CLASS_NAMES[class_idx]
        water = PLANT_WATER_MAP.get(plant_name, "do am dat 60%")

        return {
            "plant": plant_name,
            "confidence": round(confidence, 4),
            "water_recommendation": water,
            "all_predictions": {
                CLASS_NAMES[i]: float(predictions[0][i])
                for i in range(len(CLASS_NAMES))
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Loi xu ly anh: {e}")