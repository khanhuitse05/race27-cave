// Cấu hình thương hiệu và nội dung cho Đấu trường Rasson Billiards

export const BRAND = {
  name: 'Rasson Billiards',
  tournamentName: 'Race 27 Gia Đình',
  signTop: 'CHAMPIONSHIP ARENA & LOUNGE',
  signMain: 'RASSON BILLIARDS',
  tagline: 'Nơi hội tụ của anh em cơ thủ: giao lưu đường cơ, thách đấu phá bi, cùng dọn bàn và chia sẻ đam mê!',
  disclaimer: 'Không gian 3D giao lưu cộng đồng cơ thủ Rasson Billiards. Phi thương mại.',
  roomName: 'Đấu trường Rasson Arena VIP',
  tableModel: 'Rasson Ox Official Tournament Table',
  // Màu sắc thương hiệu
  cloth: '#0d5ea6', // Vải nỉ Simonis 860 Electric Blue chính hãng
  clothOptions: [
    { name: 'Simonis Blue', color: '#0d5ea6' },
    { name: 'Tournament Green', color: '#10643d' },
    { name: 'Royal Purple', color: '#5b21b6' },
    { name: 'Slate Grey', color: '#334155' },
    { name: 'Crimson Red', color: '#881337' },
  ],
  // Trang phục cơ thủ thi đấu chuyên nghiệp
  jersey: {
    body: '#111827', // Áo polo đen thể thao chuyên nghiệp
    trim: '#d4af37', // Viền vàng kim loại sang trọng
    accent: '#0d5ea6', // Điểm nhấn xanh Simonis
    number: '#ffffff',
  },
};

// Bảng màu 16 bi tiêu chuẩn quốc tế (0 = bi cái, 1-8 bi đặc, 9-15 bi khoang)
export const BALL_CONFIG = [
  { no: 0, name: 'Bi Cái (Cue Ball)', color: '#f8fafc', stripe: false, darkText: true },
  { no: 1, name: 'Bi 1 (Vàng)', color: '#f59e0b', stripe: false, darkText: true },
  { no: 2, name: 'Bi 2 (Xanh Dương)', color: '#2563eb', stripe: false, darkText: false },
  { no: 3, name: 'Bi 3 (Đỏ)', color: '#dc2626', stripe: false, darkText: false },
  { no: 4, name: 'Bi 4 (Tím)', color: '#7c3aed', stripe: false, darkText: false },
  { no: 5, name: 'Bi 5 (Cam)', color: '#ea580c', stripe: false, darkText: false },
  { no: 6, name: 'Bi 6 (Xanh Lá)', color: '#16a34a', stripe: false, darkText: false },
  { no: 7, name: 'Bi 7 (Nâu Đỏ)', color: '#991b1b', stripe: false, darkText: false },
  { no: 8, name: 'Bi 8 (Đen)', color: '#111827', stripe: false, darkText: false },
  { no: 9, name: 'Bi 9 (Sọc Vàng)', color: '#f59e0b', stripe: true, darkText: true },
  { no: 10, name: 'Bi 10 (Sọc Xanh)', color: '#2563eb', stripe: true, darkText: false },
  { no: 11, name: 'Bi 11 (Sọc Đỏ)', color: '#dc2626', stripe: true, darkText: false },
  { no: 12, name: 'Bi 12 (Sọc Tím)', color: '#7c3aed', stripe: true, darkText: false },
  { no: 13, name: 'Bi 13 (Sọc Cam)', color: '#ea580c', stripe: true, darkText: false },
  { no: 14, name: 'Bi 14 (Sọc Lá)', color: '#16a34a', stripe: true, darkText: false },
  { no: 15, name: 'Bi 15 (Sọc Nâu)', color: '#991b1b', stripe: true, darkText: false },
];

export const CUE_STYLES = [
  { id: 'ngocmy', name: 'Ngọc Mỹ', shaft: '#1f242d', wrap: '#111827', ring: '#d4af37' },
  { id: 'revo', name: 'Predator Cobalt', shaft: '#181b22', wrap: '#1e3a8a', ring: '#60a5fa' },
  { id: 'flame', name: 'Flame Maple Classic', shaft: '#d97706', wrap: '#451a03', ring: '#fbbf24' },
  { id: 'dragon', name: 'Crimson Dragon', shaft: '#262626', wrap: '#991b1b', ring: '#f87171' },
];

// Câu hỏi vui về kiến thức bida trước khi vào đấu trường
export const QUIZ = [
  {
    q: 'Bàn thi đấu Rasson Ox tiêu chuẩn Matchroom World Pool có kích thước bao nhiêu feet?',
    options: ['9 feet (chuẩn quốc tế)', '7 feet (bàn nhỏ)', '8 feet', '12 feet (bàn Snooker)'],
    answer: 0,
    hint: 'Bàn 9 feet là tiêu chuẩn thi đấu Pool quốc tế hàng đầu!',
  },
  {
    q: 'Trong thể thức 9 bi (9-Ball), đánh bi nào rơi vào lỗ hợp lệ sẽ thắng ngay ván đấu?',
    options: ['Bi số 9', 'Bi số 1', 'Bi số 8', 'Bi cái'],
    answer: 0,
    hint: 'Bi số 9 màu sọc vàng là mục tiêu quyết định trận đấu!',
  },
  {
    q: 'Khi đầu tẩy cơ (tip) bị trượt cơ (miscue) do thiếu ma sát với bi cái, cơ thủ cần bôi gì?',
    options: ['Bôi lơ (Chalk)', 'Bôi nước', 'Bôi dầu dừa', 'Bôi bột mì'],
    answer: 0,
    hint: 'Viên lơ xanh giúp tăng tối đa ma sát và độ bám cho đầu cơ.',
  },
  {
    q: 'Huyền thoại Billiards Efren Reyes được cả thế giới tôn xưng với biệt danh lẫy lừng nào?',
    options: ['The Magician (Phù thuỷ)', 'The Rocket', 'The Sniper', 'The Emperor'],
    answer: 0,
    hint: 'Biệt danh "The Magician" gắn liền với những đường cơ ma thuật không tưởng!',
  },
  {
    q: 'Kỹ thuật dùng cơ đánh đưa bi cái bay bổng qua chướng ngại vật bi khác vào lỗ gọi là gì?',
    options: ['Jump shot (Cú nhảy bi)', 'Masse shot', 'Draw shot (Trổ)', 'Bank shot (A-băng)'],
    answer: 0,
    hint: 'Jump shot là kỹ thuật đòi hỏi gậy nhảy chuyên dụng và góc phát lực cực chuẩn.',
  },
  {
    q: 'Tên dòng vải nỉ thi đấu nức tiếng thế giới trải trên bàn Rasson Arena là gì?',
    options: ['Iwan Simonis (Bỉ)', 'Vải nhung lông cừu', 'Vải Kaki', 'Vải dù chống thấm'],
    answer: 0,
    hint: 'Iwan Simonis sản xuất tại Bỉ từ năm 1680, chuẩn mực số 1 của bi-a thế giới!',
  },
];

// Bảng điểm giải đấu Race 27 Gia Đình
export const SCOREBOARD = {
  title: 'RACE 27 GIA ĐÌNH',
  image: '/images/scoreboard.jpg',
  note: 'BẢNG TỈ SỐ CHÍNH THỨC — RACE 27 GIA ĐÌNH 🎱',
  players: [
    { name: 'James', score: -9, diff: -1, color: '#a855f7' },
    { name: 'Khá', score: 21, diff: 1, color: '#3b82f6' },
    { name: 'Damy', score: 5, color: '#22c55e' },
    { name: 'Bino', score: -14, color: '#854d0e' },
    { name: 'Lú', score: -3, color: '#06b6d4' },
  ],
};

// Chân dung các huyền thoại làng Pool thế giới và Việt Nam
export const LEGENDS = [
  { name: 'Efren Reyes', title: 'The Magician', country: '🇵🇭' },
  { name: 'Dương Quốc Hoàng', title: 'Hoàng Sao', country: '🇻🇳' },
  { name: 'Shane Van Boening', title: 'The South Dakota Kid', country: '🇺🇸' },
  { name: 'Joshua Filler', title: 'The Killer', country: '🇩🇪' },
  { name: 'Fedor Gorst', title: 'World Champion', country: '🇺🇸' },
  { name: 'Francisco Sanchez Ruiz', title: 'El Tornado', country: '🇪🇸' },
  { name: 'Nguyễn Anh Tuấn', title: 'Tuấn Kon', country: '🇻🇳' },
  { name: 'Ko Pin Yi', title: 'The Prince of Pool', country: '🇹🇼' },
];
