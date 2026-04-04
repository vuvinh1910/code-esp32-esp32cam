# Plant Identification AI Model (ESP32-CAM)

Mo hinh AI nhan dien 3 loai cay:
- xuong_rong
- nha_dam
- bac_ha

ESP32-CAM chi chup va gui anh. Suy luan AI chay tren server FastAPI.

## Cau truc Project

```
MODEL-AI/
|-- train.py               # Train model
|-- main.py                # API predict
|-- augment_dataset.py     # Nhan anh tu anh goc
|-- predict_test.py        # Test nhanh model
|-- requirements.txt
|-- plant_model.h5         # Tao sau khi train
|-- class_names.json       # Tao sau khi train
`-- dataset/
    |-- xuong_rong/
    |-- nha_dam/
    `-- bac_ha/
```

## Quy trinh su dung

1. Tao du lieu goc (luc nay ban chua co anh thi de san cau truc truoc)
- Tao 3 thu muc:
  - dataset/xuong_rong/
  - dataset/nha_dam/
  - dataset/bac_ha/
- Sau nay moi thu muc bo vao khoang 10 anh goc.

2. Cai thu vien
```bash
pip install -r requirements.txt
```

3. Nhan anh tu 10 anh/lop len so luong lon hon
```bash
python augment_dataset.py --target-per-class 200
```
- Lenh tren se tao them anh augment de dat tong 200 anh cho moi lop.
- Neu lop nao da >= 200 anh thi script tu bo qua lop do.

4. Train model
```bash
python train.py
```
- Output:
  - plant_model.h5
  - class_names.json

5. Chay API
```bash
uvicorn main:app --reload
```
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## API endpoint

POST /api/ai/identify

Request:
```
Content-Type: multipart/form-data
file: <image_file>
```

Response mau:
```json
{
  "plant": "nha_dam",
  "confidence": 0.9132,
  "water_recommendation": "80ml/ngay",
  "all_predictions": {
    "bac_ha": 0.0123,
    "nha_dam": 0.9132,
    "xuong_rong": 0.0745
  }
}
```

## Luu y quan trong
- Ten folder class phai dung chinh xac: xuong_rong, nha_dam, bac_ha.
- Khong can sua tay class trong code train, script se doc class tu dataset.
- Model hien tai phu hop cho server. ESP32-CAM khong chay truc tiep TensorFlow model nay.
