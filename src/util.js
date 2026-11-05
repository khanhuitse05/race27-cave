import { BALL_CONFIG, BRAND } from './config.js';

/** Tạo DOM gọn: el('div', { className: 'x' }, child1, 'text'). */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') node.style.cssText = v;
    else if (k.includes('-')) node.setAttribute(k, v);
    else node[k] = v;
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

const PROFILE_KEY = 'rasson_billiards.profile';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || '',
      number: parsed.number ?? 8,
      title: parsed.title || 'Cơ thủ Tập sự',
      cueStyle: parsed.cueStyle || 'carbon',
      clothColor: parsed.clothColor || BRAND.cloth,
    };
  } catch {
    return getDefaultProfile();
  }
}

function getDefaultProfile() {
  return {
    name: '',
    number: 8,
    title: 'Cơ thủ Tập sự',
    cueStyle: 'carbon',
    clothColor: BRAND.cloth,
  };
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Trình duyệt chặn storage: bỏ qua
  }
}

/**
 * Vẽ icon Bi Bida (1-15 hoặc bi cái) dạng 2D photorealistic lên canvas
 */
export function drawPoolBallIcon(canvas, number = 8) {
  const g = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) / 2 - 2;
  const cx = w / 2;
  const cy = h / 2;

  g.clearRect(0, 0, w, h);

  const num = Number.isInteger(number) ? Math.min(15, Math.max(0, number)) : 8;
  const cfg = BALL_CONFIG[num] || BALL_CONFIG[8];

  // Đổ bóng chân
  g.beginPath();
  g.ellipse(cx, cy + r * 0.85, r * 0.75, r * 0.22, 0, 0, Math.PI * 2);
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  g.filter = 'blur(3px)';
  g.fill();
  g.filter = 'none';

  // Khối bi tròn cơ sở
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();

  if (cfg.stripe) {
    // Bi sọc (9-15): Nền trắng, dải màu ở giữa
    g.fillStyle = '#f8fafc';
    g.fillRect(0, 0, w, h);

    // Dải sọc màu
    g.fillStyle = cfg.color;
    g.beginPath();
    g.rect(0, cy - r * 0.52, w, r * 1.04);
    g.fill();
  } else {
    // Bi đặc (1-8): Toàn bộ 1 màu
    g.fillStyle = cfg.color;
    g.fillRect(0, 0, w, h);
  }

  // Điểm vòng tròn trắng ở tâm chứa số
  if (num > 0) {
    g.beginPath();
    g.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.15)';
    g.lineWidth = 1;
    g.stroke();

    // Số bi
    g.fillStyle = '#111827';
    g.font = `900 ${Math.round(r * 0.48)}px "Bitter", Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(num), cx, cy + 1);

    // Gạch chân số 6 và 9 để phân biệt chuẩn thi đấu
    if (num === 6 || num === 9) {
      g.fillRect(cx - r * 0.16, cy + r * 0.28, r * 0.32, Math.max(1.5, r * 0.06));
    }
  }

  // Đổ bóng 3D cầu (Shading)
  const grad = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();

  // Vệt sáng bóng kính (Specular reflection)
  g.beginPath();
  g.ellipse(cx - r * 0.36, cy - r * 0.36, r * 0.3, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
  g.fillStyle = 'rgba(255, 255, 255, 0.65)';
  g.fill();

  g.restore();
}

/**
 * Vẽ Logo Rasson Billiards sang trọng lên canvas (dùng làm texture bảng hiệu & HUD)
 */
export function drawRassonLogo(canvas, width, height) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height * 0.4;

  // Nền bo góc cao cấp
  const bgGrad = g.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#151922');
  bgGrad.addColorStop(1, '#0a0d12');
  g.fillStyle = bgGrad;
  g.beginPath();
  g.roundRect(4, 4, width - 8, height - 8, 16);
  g.fill();

  // Viền vàng kim loại Rasson
  g.strokeStyle = '#d4af37';
  g.lineWidth = 3;
  g.stroke();

  // Huy hiệu hai gậy bida bắt chéo (Crossed Cues)
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-50, -35);
  g.lineTo(50, 35);
  g.moveTo(50, -35);
  g.lineTo(-50, 35);
  g.stroke();
  g.restore();

  // Bi số 8 tâm huy hiệu
  const ballR = Math.min(width, height) * 0.14;
  g.beginPath();
  g.arc(cx, cy, ballR, 0, Math.PI * 2);
  g.fillStyle = '#0f172a';
  g.fill();
  g.strokeStyle = '#d4af37';
  g.lineWidth = 2.5;
  g.stroke();

  g.beginPath();
  g.arc(cx, cy, ballR * 0.5, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();
  g.fillStyle = '#0f172a';
  g.font = `900 ${Math.round(ballR * 0.6)}px "Bitter", serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('8', cx, cy + 1);

  // Chữ RASSON BILLIARDS
  g.fillStyle = '#d4af37';
  g.font = '700 13px "Be Vietnam Pro", sans-serif';
  g.textAlign = 'center';
  g.letterSpacing = '3px';
  g.fillText('OFFICIAL ARENA', cx, height * 0.72);

  g.fillStyle = '#ffffff';
  g.font = '900 24px "Bitter", Georgia, serif';
  g.letterSpacing = '2px';
  g.fillText('RASSON', cx, height * 0.86);
}
