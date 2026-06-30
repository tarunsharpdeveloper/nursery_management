<?php
/**
 * PHP Router for Next.js Static Export
 * This file forces root path to serve index.html
 * Upload BOTH index.html AND index.php to your server
 */

// Get the request URI
$request_uri = $_SERVER['REQUEST_URI'];
$document_root = $_SERVER['DOCUMENT_ROOT'];

// Remove query string
$path = strtok($request_uri, '?');
$path = rtrim($path, '/');

// Root path - serve index.html
if (empty($path) || $path === '' || $path === '/') {
    // Force serve index.html
    if (file_exists($document_root . '/index.html')) {
        readfile($document_root . '/index.html');
        exit;
    }
}

// Check if static file exists
$file_path = $document_root . $path;
if (file_exists($file_path) && is_file($file_path)) {
    // Serve the file with appropriate MIME type
    $mime_types = [
        'html' => 'text/html',
        'js' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
    ];
    
    $extension = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    readfile($file_path);
    exit;
}

// Check if .html version exists (Next.js pages)
$html_path = $document_root . $path . '.html';
if (file_exists($html_path)) {
    readfile($html_path);
    exit;
}

// Fallback to index.html for client-side routing
if (file_exists($document_root . '/index.html')) {
    readfile($document_root . '/index.html');
    exit;
}

// If nothing found, return 404
http_response_code(404);
echo '404 - Page Not Found';
?>
