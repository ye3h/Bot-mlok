import ui, os, datetime
from urllib.parse import unquote

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'index.html')
DEBUG = os.path.join(BASE, 'index_debug.html')
LOG = os.path.join(BASE, 'error run.txt')

def log(text):
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(datetime.datetime.now().strftime('%H:%M:%S') + '  ' + text + '\n')

HOOK = '''<script>
(function () {
  function send(t) {
    var f = document.createElement('iframe');
    f.style.display = 'none';
    f.src = 'dbglog://' + encodeURIComponent(t);
    (document.body || document.documentElement).appendChild(f);
    setTimeout(function () { f.remove(); }, 100);
  }
  window.addEventListener('error', function (e) {
    if (e.target && e.target !== window && (e.target.src || e.target.href)) {
      send('MISSING/FAILED: ' + (e.target.src || e.target.href));
    } else {
      send('JS ERROR: ' + e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || ''));
    }
  }, true);
  window.addEventListener('load', function (e) {
    if (e.target && e.target.tagName === 'SCRIPT') send('LOADED: ' + e.target.src);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    send('PROMISE: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });
  setTimeout(function () {
    send('MODULES: ' + (window.ModuleRegistry
      ? ModuleRegistry.all().map(function (m) { return m.id; }).join(', ')
      : 'NO REGISTRY'));
  }, 2000);
  send('PAGE START');
})();
</script>'''

class Delegate(object):
    def webview_should_start_load(self, webview, url, nav_type):
        if url.startswith('dbglog://'):
            log(unquote(url[len('dbglog://'):]))
            return False
        return True
    def webview_did_start_load(self, webview):
        pass
    def webview_did_finish_load(self, webview):
        pass
    def webview_did_fail_load(self, webview, error_code, error_msg):
        log('LOAD FAIL: %s %s' % (error_code, error_msg))

open(LOG, 'w', encoding='utf-8').close()
log('=== RUN START ===')

src = open(SRC, encoding='utf-8').read()
open(DEBUG, 'w', encoding='utf-8').write(src.replace('<head>', '<head>' + HOOK, 1))

v = ui.WebView()
v.delegate = Delegate()
v.load_url(DEBUG)
v.present('fullscreen')
