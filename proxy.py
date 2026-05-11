#!/usr/bin/env python3
"""
本地代理服务器：同时提供静态文件服务 + AI API 转发（解决 CORS 问题）
用法：python3 proxy.py
访问：http://localhost:8080
"""
import http.server
import subprocess
import json
import os

PORT = 8080
PROXY_PATH = '/api-proxy'


class Handler(http.server.SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path == PROXY_PATH:
            self._handle_proxy()
        else:
            self.send_error(404)

    def _handle_proxy(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body)
        except Exception:
            self.send_error(400, 'Bad JSON')
            return

        target_url = payload.pop('__target_url__', None)
        api_key    = payload.pop('__api_key__', None)
        if not target_url:
            self.send_error(400, 'Missing __target_url__')
            return

        cmd = [
            'curl', '-s', '--max-time', '60',
            '-X', 'POST', target_url,
            '-H', 'Content-Type: application/json',
            '-d', json.dumps(payload),
        ]
        if api_key:
            cmd += ['-H', f'Authorization: Bearer {api_key}']

        try:
            result = subprocess.run(cmd, capture_output=True, timeout=65)
            resp_body = result.stdout
            if not resp_body:
                stderr = result.stderr.decode(errors='replace')
                self._error(502, f'上游无响应（curl exit {result.returncode}）: {stderr[:200]}')
                return
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(resp_body)
        except subprocess.TimeoutExpired:
            self._error(504, '请求超时：上游 API 60 秒内无响应')
        except Exception as e:
            self._error(502, str(e))

    def _error(self, code, msg):
        body = json.dumps({'error': {'message': msg}}).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    def log_message(self, fmt, *args):
        path = args[0] if args else ''
        if PROXY_PATH in str(path):
            print(f'[proxy] {fmt % args}')
        else:
            super().log_message(fmt, *args)


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), Handler) as httpd:
        print(f'服务已启动：http://localhost:{PORT}')
        print(f'AI 代理地址：http://localhost:{PORT}{PROXY_PATH}')
        httpd.serve_forever()
