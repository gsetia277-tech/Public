const valueInput = document.getElementById('qrValue');
const qrElement = document.getElementById('qrcode');
const classInput = document.getElementById('classValue');
const status = document.getElementById('status');
let qrCode;

function renderQr() {
  const value = valueInput.value.trim() || 'Nama Teman';
  const className = classInput.value.trim() || 'XII RPL';
  const payload = JSON.stringify({ nama: value, kelas: className });
  qrElement.replaceChildren();
  qrCode = new QRCode(qrElement, { text: payload, width: 210, height: 210, correctLevel: QRCode.CorrectLevel.M });
  status.textContent = `QR: ${value} - ${className}`;
}

valueInput.addEventListener('input', renderQr);
classInput.addEventListener('input', renderQr);
document.getElementById('download').addEventListener('click', () => {
  const image = qrElement.querySelector('img');
  if (!image) return;
  const link = document.createElement('a');
  link.download = `qr-${valueInput.value.trim() || 'nama-teman'}.png`;
  link.href = image.src;
  link.click();
});
renderQr();
