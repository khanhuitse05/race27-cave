# 🎱 Rasson Billiards — Đấu Trường Cơ Thủ 3D Thời Gian Thực

Không gian 3D nhiều người chơi trực tuyến dành riêng cho cộng đồng cơ thủ: vào đấu trường, giao lưu đường cơ, thách đấu, tương tác phá bi trên bàn Rasson Ox chuẩn quốc tế, ăn mừng chiến thắng và trò chuyện cùng anh em theo thời gian thực.

Dự án được tái thiết kế và nâng cấp toàn diện từ phong cách ban đầu sang phong cách **Billiards thể thao cao cấp**, lấy cảm hứng từ thương hiệu bàn thi đấu danh tiếng **Rasson Billiards** (Bàn đấu chính thức của Matchroom Pool, Mosconi Cup, World Pool Championship).

---

## 🌟 Điểm nổi bật & Cải tiến vượt trội

1. **Không gian Đấu trường ngầm Rasson VIP**:
   - Vòm đá hang động sang trọng kết hợp sàn đá phiến đen và hệ thống đèn LED arena hiện đại.
   - Bàn bida trung tâm **Rasson Ox Tournament 9-Foot**: Chân bàn chữ V vát cạnh mạ vàng, nẹp kim loại Rasson, mặt nỉ **Simonis 860 Electric Blue**, hệ thống điểm ngắm xà cừ và 6 lỗ bida chuẩn thi đấu.
   - Dàn đèn phẳng Matchroom không bóng rọi sáng rực rỡ mặt bàn từ trên cao.

2. **Cụm Bi 9-Ball & Vật lý Phá Bi (Break Shot Minigame)**:
   - Bộ 9 bi xếp chuẩn hình thoi (bi 1 ở đỉnh, bi 9 ở tâm) và bi cái ở vạch đầu bàn.
   - Người chơi khi đứng gần bàn có thể nhấn **Space** hoặc nhấp **"Phá bi Rasson"** để thực hiện cú phá bi uy lực.
   - Hệ thống mô phỏng vật lý bi lăn, va chạm đàn hồi, nảy băng và rơi lỗ cùng hiệu ứng âm thanh va đập chân thực!
   - Nút **"Xếp lại bi (R)"** xếp lại cụm bi bất cứ lúc nào và đồng bộ với tất cả người chơi trong phòng.

3. **Cơ thủ & Gậy cơ Chuyên nghiệp**:
   - Nhân vật mặc áo thi đấu Polo có nẹp cổ và logo Rasson trước ngực.
   - Mặt sau áo in **Bi số may mắn (1–15)** do người chơi lựa chọn (bi đặc 1-8, bi sọc 9-15).
   - Tay trái đeo găng bida 3 ngón xanh Simonis, tay phải cầm gậy cơ **Rasson Pro Carbon** với ngọn carbon, phíp trắng và đầu tẩy dính lơ xanh.
   - Động tác: Dáng đứng chọc cơ chính xác khi thách đấu (`F`), giương cao gậy cơ khi ăn mừng (`G`), trạng thái Thần cơ hồi sức (ma) khi hết máu.

4. **Nhiều Góc nhìn Camera (Camera Modes)**:
   - Nhấn **C** hoặc nút Camera trên HUD để chuyển đổi giữa 3 góc nhìn:
     - **3rd Person**: Góc nhìn truyền thống phía sau lưng cơ thủ (cuộn chuột để zoom xa/gần 3.2m – 12m).
     - **1st Person**: Góc nhìn thứ nhất từ tầm mắt cơ thủ ngắm dọc thân gậy.
     - **Table Cam**: Góc quay điện ảnh bao quát toàn cảnh bàn bida Rasson trung tâm.

5. **Hệ thống Âm thanh Bida Synthesized WebAudio**:
   - Âm thanh thuần WebAudio tổng hợp trực tiếp không cần tải file ngoài:
     - `cueHit`: Tiếng tẩy da và đầu cơ tiếp xúc gõ bi giòn tan.
     - `ballClick`: Tiếng va chạm lách cách của chất liệu nhựa phenolic resin cao cấp.
     - `pocketDrop`: Tiếng bi rơi vào rọ da trầm ấm.
     - `chalk`: Tiếng thoa lơ vào đầu tẩy.
     - `cheer`: Hợp âm kèn fanfare rực rỡ khi ăn mừng cùng pháo giấy kim tuyến.

6. **Bảng điểm Kỹ thuật số & Highlight Pool**:
   - Màn hình lớn hiển thị bảng điểm kiểu Matchroom World Pool: tỉ số, cơ thủ thi đấu, thể thức Race to 11.
   - Chiếu video highlight bi-a đặc sắc (Efren Reyes, Dương Quốc Hoàng, Shane Van Boening, Joshua Filler...).
   - Bảng vinh danh Hall of Fame với poster chân dung các huyền thoại làng Pool.

7. **Tương tác Multiplayer đa dạng**:
   - Chat trực tiếp có thẻ tên và danh hiệu cơ thủ (Cơ thủ Tập sự, Thiện xạ Lỗ mười, Cơ thần Phá bi, Vua Dọn bàn, Phù thuỷ Bida...).
   - Thanh thả cảm xúc nhanh: 🎱, 🏆, 🎯, 🔥, 👏, 🍺 bay bổng trên đầu nhân vật.
   - Bình chọn dự đoán nhà vô địch giải đấu với kết quả cập nhật trực tiếp.
   - Hỗ trợ đầy đủ chuột + phím (PC) và Cần gạt ảo + Nút chạm cảm ứng (Điện thoại/Tablet).

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local

### 1. Yêu cầu môi trường
- Node.js >= 20
- npm >= 10

### 2. Khởi chạy chế độ Phát triển (Dev)
```bash
npm install
npm run dev
```
Trình duyệt sẽ tự mở tại: `http://localhost:5173` (kết nối máy chủ WebSocket tại cổng 8787).

### 3. Đóng gói & Chạy Bản Production
```bash
npm run build
npm start
```
Ứng dụng sẽ chạy đơn cổng tại `http://localhost:8787` (phục vụ cả Web tĩnh và WebSocket `/ws`).

---

## ☁️ Đưa lên mạng miễn phí (Render.com)

1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn.
2. Truy cập [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** → chọn repository này.
3. Render sẽ tự động đọc file `render.yaml` và triển khai Web Service gói Free.
4. Sau khi quá trình build hoàn tất, mở đường dẫn `https://<ten-dich-vu>.onrender.com`.

> **Ghi chú gói Free**: Render sẽ tạm ngủ sau 15 phút không có lượt truy cập. Khi có người vào đấu trường, client sẽ tự động gửi gói tin giữ kết nối (ping) mỗi 30 giây để server không bao giờ bị ngủ khi đang có anh em trong phòng!

---

## 🛠️ Tuỳ chỉnh nội dung & Thương hiệu

Mọi thông số về bảng điểm, câu hỏi đố vui, danh sách cơ thủ huyền thoại, video highlight và màu vải nỉ đều được cấu hình tập trung tại:
👉 `src/config.js`

- **Đổi tên thương hiệu / Khẩu hiệu**: Sửa object `BRAND`.
- **Đổi câu hỏi đố bida**: Chỉnh sửa mảng `QUIZ`.
- **Đổi danh sách video chiếu màn hình**: Thêm YouTube Video ID vào `SCOREBOARD.youtubeIds`.
- **Đổi bảng điểm trận đấu**: Chỉnh sửa `SCOREBOARD.home`, `away`, `score`, `race`.
- **Thêm cơ thủ huyền thoại**: Chỉnh sửa mảng `LEGENDS`.

---

## 📂 Cấu trúc Thư mục

```
rasson-billiards/
├── index.html          # Khung HTML gốc với meta tag & favicon bi 8
├── package.json        # Định nghĩa dependencies (Three.js, ws, fonts, vite)
├── render.yaml         # Blueprint triển khai tự động lên Render
├── vite.config.js      # Cấu hình Vite & proxy dev sang backend WebSocket
├── server/
│   └── index.js        # Server Node.js: HTTP static, /api/stats, WebSocket /ws
└── src/
    ├── main.js         # Entrypoint định tuyến (#/ và #/arena)
    ├── config.js       # Cấu hình thương hiệu, bi bida, câu đố, bảng điểm
    ├── util.js         # Tiện ích DOM, vẽ icon bi bida 2D, lưu profile
    ├── audio.js        # Bộ tổng hợp âm thanh WebAudio (tiếng gõ bi, lơ, ăn mừng)
    ├── avatar.js       # Model cơ thủ 3D, áo polo, găng tay, gậy cơ Rasson
    ├── scenery.js      # Bàn Bida Rasson Ox 3D, vật lý phá bi, đèn LED
    ├── landing.js      # Màn hình tiền sảnh 3D, hộp nhập tên, câu đố vui
    ├── cave.js         # Đấu trường ngầm chính: HUD, điều khiển, đồng bộ multiplayer
    └── style.css       # Toàn bộ CSS phong cách sang trọng Dark & Simonis Blue
```
