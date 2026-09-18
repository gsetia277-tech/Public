<?php
declare(strict_types=1);

// Share the same page with the static entry point so both versions stay in sync.
header('Content-Type: text/html; charset=UTF-8');
readfile(__DIR__ . '/index.html');
