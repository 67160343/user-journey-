let currentStep = 1;
let lookupTimeout = null;

// ฟังก์ชันสลับหน้าจอ (State Switcher)
function nextStep(step) {
    document.querySelectorAll('.journey-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    currentStep = step;
}

// ขั้นตอนที่ 2: จำลอง OCR ดึงข้อมูลบัตรประชาชน
async function triggerOCR() {
    try {
        const res = await fetch('/api/ocr-mock');
        const data = await res.json();
        document.getElementById('ocr-id').value = data.citizen_id;
        document.getElementById('ocr-name').value = data.th_name;
        document.getElementById('ocr-result').classList.remove('hidden');
    } catch (err) {
        alert("OCR มีปัญหา กรุณาลองใหม่อีกครั้ง");
    }
}

// ขั้นตอนที่ 3: จำลอง Liveness Detection พร้อม Fallback Handle
function simulateLiveness() {
    const info = document.getElementById('liveness-instruction');
    info.innerText = "กำลังประมวลผลการสแกนใบหน้า...";
    
    setTimeout(() => {
        // จำลองเหตุการณ์ผ่าน Happy Path
        info.innerText = "ตรวจสอบใบหน้าสำเร็จ!";
        setTimeout(() => nextStep(4), 1000);
    }, 1500);
}

// ขั้นตอนที่ 5: ทำ Real-time Lookup ชื่อพร้อมเพย์ เมื่อพิมพ์ครบกำหนด
function debounceLookup() {
    clearTimeout(lookupTimeout);
    const value = document.getElementById('target-input').value;
    const receiverInfo = document.getElementById('receiver-info');
    const btnTransfer = document.getElementById('btn-transfer');

    if (value.length >= 10) {
        lookupTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/promptpay/lookup?value=${value}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                
                receiverInfo.innerHTML = `✅ <strong>ชื่อผู้รับ:</strong> ${data.receiver_name}`;
                receiverInfo.classList.remove('hidden');
                btnTransfer.disabled = false; // เปิดปุ่มให้กดโอนเงินได้
            } catch {
                receiverInfo.innerHTML = `❌ ไม่พบหมายเลขพร้อมเพย์นี้`;
                receiverInfo.classList.remove('hidden');
                btnTransfer.disabled = true;
            }
        }, 500); // Debounce 500ms
    } else {
        receiverInfo.classList.add('hidden');
        btnTransfer.disabled = true;
    }
}

// ขั้นตอนที่ 6: กดยืนยันการโอนเงินพร้อมแนบคีย์ป้องกันโอนซ้ำ (Idempotency Key)
async function confirmTransfer() {
    const amount = parseFloat(document.getElementById('amount-input').value);
    const targetValue = document.getElementById('target-input').value;
    const btnTransfer = document.getElementById('btn-transfer');

    if (!amount || amount <= 0) {
        alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
        return;
    }

    // สร้าง Unique Request ID ประจำ Transaction นี้
    const requestId = "REQ-" + Date.now();
    btnTransfer.disabled = true; // ป้องกันการกดย้ำบน UI ทันที
    btnTransfer.innerText = "กำลังโอนเงิน...";

    try {
        const res = await fetch('/api/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/center',
                'Content-Type': 'application/json',
                'X-Request-ID': requestId // ส่งไปยัง Backend เพื่อทำ Idempotent Lock
            },
            body: JSON.stringify({
                target_type: 'phone',
                target_value: targetValue,
                amount: amount
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            alert(data.detail || "เกิดข้อผิดพลาดในการโอนเงิน");
            btnTransfer.disabled = false;
            btnTransfer.innerText = "ตรวจสอบสิทธิ์และโอนเงิน";
            return;
        }

        // แสดง E-Slip สำเร็จ
        const slipHtml = `
            <h3 style="color:var(--success); text-align:center;">โอนเงินสำเร็จ</h3>
            <p><strong>รหัสรายการ:</strong> ${data.transaction_id}</p>
            <p><strong>ผู้รับ:</strong> นาย สมชาย มั่งมี</p>
            <p><strong>จำนวนเงิน:</strong> ${data.amount.toFixed(2)} บาท</p>
            <p><strong>ค่าธรรมเนียม:</strong> ${data.fee.toFixed(2)} บาท</p>
            <p style="font-size:12px; color:#888; text-align:center;">สลิปนี้ได้รับการยืนยันจากธนาคารแห่งประเทศไทย</p>
        `;
        document.getElementById('slip-content').innerHTML = slipHtml;
        nextStep(6);

    } catch (err) {
        alert("เครือข่ายมีปัญหา กรุณาตรวจสอบประวัติการทำรายการ");
        btnTransfer.disabled = false;
        btnTransfer.innerText = "ตรวจสอบสิทธิ์และโอนเงิน";
    }
}

function resetJourney() {
    document.getElementById('target-input').value = '';
    document.getElementById('amount-input').value = '';
    document.getElementById('receiver-info').classList.add('hidden');
    document.getElementById('ocr-result').classList.add('hidden');
    nextStep(1);
}