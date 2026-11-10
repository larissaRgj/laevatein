'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const FIRST_PORT = 8765;
const MAX_PORT_ATTEMPTS = 10;
const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8'
};

function respond(response, status, message) {
    response.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
    });
    response.end(message);
}

const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        respond(response, 405, 'Method not allowed');
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, `http://${HOST}`).pathname);
    } catch {
        respond(response, 400, 'Invalid URL');
        return;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = path.resolve(ROOT, relativePath);
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
        respond(response, 403, 'Forbidden');
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            respond(response, 404, 'Not found');
            return;
        }

        response.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', error => {
            console.error(`Could not read "${filePath}": ${error.message}`);
            if (!response.headersSent) respond(response, 500, 'Could not read file');
            else response.destroy(error);
        });
        stream.pipe(response);
    });
});

function openBrowser(url) {
    if (process.env.LAEVATEIN_NO_OPEN_BROWSER === '1') return;

    if (process.platform !== 'win32') {
        console.log(`Open this address in your browser: ${url}`);
        return;
    }

    const child = spawn('cmd.exe', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
    });
    child.on('error', error => console.error(`Could not open the browser: ${error.message}`));
    child.unref();
}

function listen(port, attempt = 0) {
    server.once('error', error => {
        if (error.code === 'EADDRINUSE' && attempt + 1 < MAX_PORT_ATTEMPTS) {
            listen(port + 1, attempt + 1);
            return;
        }

        console.error(`Could not start the local game server: ${error.message}`);
        process.exitCode = 1;
    });

    server.listen(port, HOST, () => {
        const url = `http://${HOST}:${port}/`;
        console.log(`Laevatein is ready at ${url}`);
        console.log('Keep this window open while you play. Press Ctrl+C to stop the server.');
        openBrowser(url);
    });
}

listen(FIRST_PORT);
