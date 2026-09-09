<?php
/* ============================================================
   Grail — signup form handler
   Posts from the form on slide 9 and emails the result.

   Deliberately dependency-free: plain mail(), no composer, no SMTP
   library. That works on almost every shared host. If your host needs
   authenticated SMTP instead, see the note at the bottom of README.md.
   ============================================================ */

declare(strict_types=1);

/* ── Settings ─────────────────────────────────────────────── */
$TO      = 'kurejas@gmail.com';
$SUBJECT = 'Grail — new signup';

/* The From address must belong to the domain actually sending, or the
   receiving server will treat it as forgery and bin it. Once this is on
   the real host, change it to something like no-reply@yourdomain.com. */
$FROM_NAME  = 'Grail signups';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$host = preg_replace('/:\d+$/', '', $host);        // strip :8888 — a port in the
$host = preg_replace('/^www\./', '', $host);       // From domain makes it invalid
$FROM_EMAIL = 'no-reply@' . $host;

/* ── Helpers ──────────────────────────────────────────────── */
function wants_json(): bool {
    $a = $_SERVER['HTTP_ACCEPT'] ?? '';
    $x = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    /* strpos, not str_contains: MAMP here runs PHP 7.4 and str_contains is
       8.0+, which made this a fatal error on every request. */
    return strpos($a, 'application/json') !== false || $x === 'fetch';
}

/* `never` is a PHP 8.1 return type — omitted so this runs on 7.x too. */
function respond(bool $ok, string $message, int $status = 200) {
    http_response_code($status);
    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        $back = $_SERVER['HTTP_REFERER'] ?? 'index.html';
        $back = strtok($back, '#');
        $back = strtok($back, '?');
        header('Location: ' . $back . '?signup=' . ($ok ? 'ok' : 'error') . '#s9');
    }
    exit;
}

/* ── Guard rails ──────────────────────────────────────────── */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

/* Honeypot: a field real people never see and never fill in. */
if (!empty($_POST['company'] ?? '')) {
    respond(true, 'Thanks!');            // silently accept, send nothing
}

$name  = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    respond(false, 'Please enter your name.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}

/* Header injection: refuse anything with a newline in it. */
if (preg_match('/[\r\n]/', $name . $email)) {
    respond(false, 'Invalid input.', 422);
}

/* ── Compose ──────────────────────────────────────────────── */
$lines = [
    'New Grail signup',
    '',
    'Name:  ' . $name,
    'Email: ' . $email,
    '',
    'Sent:  ' . date('Y-m-d H:i:s T'),
    'Page:  ' . ($_SERVER['HTTP_REFERER'] ?? '—'),
    'IP:    ' . ($_SERVER['REMOTE_ADDR'] ?? '—'),
];
$body = implode("\r\n", $lines) . "\r\n";

$headers = [
    'From: ' . sprintf('%s <%s>', $FROM_NAME, $FROM_EMAIL),
    'Reply-To: ' . sprintf('%s <%s>', $name, $email),
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = @mail($TO, $SUBJECT, $body, implode("\r\n", $headers), '-f' . $FROM_EMAIL);

/* Keep a local copy either way — if mail() is not wired up on the box,
   this file is the only record that the form worked. */
@file_put_contents(
    __DIR__ . '/signups.log',
    date('c') . "\t" . ($sent ? 'SENT' : 'MAIL-FAILED') . "\t" . $name . "\t" . $email . "\n",
    FILE_APPEND | LOCK_EX
);

if (!$sent) {
    respond(false, 'Could not send just now — please try again later.', 500);
}

respond(true, 'Thanks! Check your inbox soon.');
