<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, x-api-key');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$databaseDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'Databases';
if (!is_dir($databaseDirectory)) {
    mkdir($databaseDirectory, 0775, true);
}
$database = new PDO('sqlite:' . $databaseDirectory . DIRECTORY_SEPARATOR . 'absensi.sqlite');
$database->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$database->exec(
    'CREATE TABLE IF NOT EXISTS absensi (
        absen_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        jam TEXT NOT NULL,
        nama TEXT NOT NULL,
        kelas TEXT NOT NULL,
        qr_id TEXT NOT NULL
    )'
);

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireApiKey(): void
{
    $key = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($key !== 'absen2026') {
        respond(['message' => 'API key tidak valid'], 401);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'absen') {
    requireApiKey();
    $body = json_decode(file_get_contents('php://input'), true);
    $qrId = trim((string) ($body['qr_id'] ?? ''));
    if ($qrId === '') {
        respond(['message' => 'QR ID wajib diisi'], 422);
    }

    $student = json_decode($qrId, true);
    $name = is_array($student) ? trim((string) ($student['nama'] ?? '')) : $qrId;
    $class = is_array($student) ? trim((string) ($student['kelas'] ?? '-')) : '-';
    if ($name === '') {
        respond(['message' => 'Nama siswa tidak ditemukan'], 422);
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
    $statement = $database->prepare(
        'INSERT INTO absensi (tanggal, jam, nama, kelas, qr_id) VALUES (:tanggal, :jam, :nama, :kelas, :qr_id)'
    );
    $statement->execute([
        ':tanggal' => $now->format('Y-m-d'),
        ':jam' => $now->format('H:i:s'),
        ':nama' => $name,
        ':kelas' => $class,
        ':qr_id' => $qrId,
    ]);
    respond(['message' => 'Absensi berhasil disimpan', 'absen_id' => $database->lastInsertId()]);
}

if ($method === 'GET' && $action === 'absensi') {
    $date = $_GET['tanggal'] ?? (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');
    $statement = $database->prepare(
        'SELECT absen_id, tanggal, jam, nama, kelas FROM absensi WHERE tanggal = :tanggal ORDER BY absen_id ASC'
    );
    $statement->execute([':tanggal' => $date]);
    respond($statement->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'DELETE' && $action === 'absensi') {
    requireApiKey();
    $id = (int) ($_GET['id'] ?? 0);
    $statement = $database->prepare('DELETE FROM absensi WHERE absen_id = :id');
    $statement->execute([':id' => $id]);
    respond(['message' => 'Absensi dihapus']);
}

respond(['message' => 'Endpoint tidak ditemukan'], 404);
