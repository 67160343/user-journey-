from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI()

# Mock Data Storage สำหรับตรวจสอบสถานะและป้องกันการโอนซ้ำ
processed_transactions = set()

class TransferRequest(BaseModel):
    target_type: str # 'phone' หรือ 'citizen_id'
    target_value: str
    amount: float

# 1. API ดึงข้อมูลจากบัตรประชาชน (Mock OCR) [Journey ขั้นตอนที่ 2]
@app.get("/api/ocr-mock")
def ocr_mock():
    return {
        "citizen_id": "1100100123456",
        "th_name": "นางสาว มิว ดีใจยิ่ง",
        "birth_date": "2002-05-20"
    }

# 2. API ตรวจสอบชื่อผู้รับโอนพร้อมเพย์ [Journey ขั้นตอนที่ 8]
@app.get("/api/promptpay/lookup")
def promptpay_lookup(value: str):
    if not value or len(value) < 10:
        raise HTTPException(status_code=400, detail="รูปแบบหมายเลขพร้อมเพย์ไม่ถูกต้อง")
    
    # Mock ข้อมูลผู้รับโอนเพื่อแสดงให้ผู้ใช้ตรวจสอบก่อนโอนจริง ลดการโอนผิดคน
    return {
        "target_value": value,
        "receiver_name": "นาย สมชาย มั่งมี (PromptPay)"
    }

# 3. API ยืนยันการโอนเงิน (มีระบบกันโอนซ้ำด้วย Request-ID) [Journey ขั้นตอนที่ 9]
@app.post("/api/transfer")
def transfer_money(req: TransferRequest, x_request_id: Optional[str] = Header(None)):
    if not x_request_id:
        raise HTTPException(status_code=400, detail="Missing X-Request-ID")
    
    # Edge Case & Acceptance Criteria: ป้องกัน double submission
    if x_request_id in processed_transactions:
        raise HTTPException(status_code=409, detail="คำขอโอนเงินนี้กำลังประมวลผล หรือสำเร็จไปแล้ว ห้ามกดย้ำ")
        
    if req.amount > 5000:
        raise HTTPException(status_code=400, detail="เกินวงเงินต่อวันของบัญชีเปิดใหม่ (จำกัด 5,000 บาท)")

    processed_transactions.add(x_request_id)
    return {
        "status": "SUCCESS",
        "transaction_id": "TXN20260718999",
        "amount": req.amount,
        "fee": 0.0,
        "timestamp": "2026-07-18T13:46:00Z"
    }

# Mount static files ของฝั่ง Frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")