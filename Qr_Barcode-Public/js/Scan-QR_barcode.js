const resultDiv = document.getElementById('result');
const demoMode = new URLSearchParams(location.search).get('mode') === 'test';
const demoButton = document.getElementById('demoButton');
const startCameraButton = document.getElementById('startCamera');
let last = '';
const html5QrCode = new Html5Qrcode('reader');

function onScanSuccess(decodedText) {
  if (decodedText === last) return;
  last = decodedText;
  let student = { nama: decodedText, kelas: '-' };
  try { student = JSON.parse(decodedText); } catch (_) { }
  saveLocalAttendance(student);
  fetch('../api.php?action=absen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'absen2026' },
    body: JSON.stringify({ qr_id: decodedText })
  })
    .then(response => response.json())
    .then(data => finishScan(student, data.message || 'Berhasil tersimpan'))
    .catch(() => finishScan(student, 'Tersimpan lokal'));
}

function finishScan(student, message) {
  resultDiv.textContent = `${message}: ${student.nama}. Membuka daftar absensi...`;
  setTimeout(() => { location.href = 'index.html?scan=success'; }, 700);
}

function saveLocalAttendance(student) {
  const attendance = JSON.parse(localStorage.getItem('absensi') || '[]');
  const now = new Date();
  attendance.push({ absen_id: Date.now(), tanggal: now.toISOString().slice(0, 10), jam: now.toLocaleTimeString('id-ID'), nama: student.nama || 'Nama Teman', kelas: student.kelas || '-' });
  localStorage.setItem('absensi', JSON.stringify(attendance));
}

if (demoMode) {
  demoButton.style.display = 'block';
  startCameraButton.style.display = 'none';
  demoButton.addEventListener('click', () => {
    last = '';
    onScanSuccess(JSON.stringify({ nama: 'Nama Teman', kelas: 'XII RPL' }));
  });
}

async function startCamera() {
  startCameraButton.disabled = true;
  resultDiv.textContent = 'Meminta izin kamera...';
  try {
    await html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, onScanSuccess);
    startCameraButton.style.display = 'none';
    resultDiv.textContent = 'Kamera aktif. Arahkan ke QR Code.';
  } catch (error) {
    startCameraButton.disabled = false;
    resultDiv.textContent = 'Kamera tidak dapat dibuka. Izinkan kamera dan gunakan alamat localhost/HTTPS.';
    console.error('Gagal membuka kamera:', error);
  }
}

startCameraButton.addEventListener('click', startCamera);
if (!demoMode) startCamera();
