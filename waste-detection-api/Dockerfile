# ใช้ Node.js Alpine เพื่อให้ Image มีขนาดเล็ก
FROM node:20-alpine

# กำหนด Directory ทำงานภายใน Container
WORKDIR /app

# คัดลอก package.json เพื่อติดตั้ง Dependencies
COPY package*.json ./
RUN npm install

# คัดลอก ซอร์สโค้ดทั้งหมดลงใน Container
COPY . .

# เปิด Port 3000
EXPOSE 3000

# คำสั่งสำหรับเริ่มรัน Application
CMD ["npm", "start"]