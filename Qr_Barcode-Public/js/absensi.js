const tBody = document.getElementById('tBody');
const info = document.getElementById('info');

async function live() {
  const today = new Date().toISOString().slice(0, 10);
  let rows = JSON.parse(localStorage.getItem('absensi') || '[]').filter(student => student.tanggal === today);
  try {
    const response = await fetch(`../api.php?action=absensi&tanggal=${today}`);
    if (response.ok) rows = await response.json();
  } catch (_) { }
  info.textContent = `Total hadir: ${rows.length}`;
  let no = 1;
  tBody.innerHTML = rows.map(student => `<tr><td>${no++}</td><td>${student.tanggal}</td><td>${student.jam}</td><td>${student.nama}</td><td>${student.kelas}</td><td><button class="btn" onclick="hapus(${student.absen_id})">Hapus</button></td></tr>`).join('');
}

async function hapus(id) {
  if (!confirm('Hapus absen ini?')) return;
  const localRows = JSON.parse(localStorage.getItem('absensi') || '[]').filter(student => student.absen_id !== id);
  localStorage.setItem('absensi', JSON.stringify(localRows));
  try { await fetch(`../api.php?action=absensi&id=${id}`, { method: 'DELETE', headers: { 'x-api-key': 'absen2026' } }); } catch (_) { }
  live();
}

live();
setInterval(live, 1000);
