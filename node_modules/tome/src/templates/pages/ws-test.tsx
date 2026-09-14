import { Layout } from "../layout";
import type { ReaderSettings } from "../../config";
import { DEFAULT_READER_SETTINGS } from "../../config";

export function WsTestPage({
  settings = DEFAULT_READER_SETTINGS,
  wsUrl,
}: {
  settings?: ReaderSettings;
  wsUrl: string;
}): JSX.Element {
  return (
    <Layout title="WebSocket Test" settings={settings}>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>WebSocket Diagnostic</h1>
        <p>Testing WebSocket support on this device...</p>
        
        <div id="status" style="margin: 20px 0; padding: 20px; border: 2px solid #333; font-size: 18px;">
          Running tests...
        </div>
        
        <div id="details" style="font-family: monospace; font-size: 14px; white-space: pre-wrap; background: #f5f5f5; padding: 15px; border: 1px solid #ccc;">
        </div>
        
        <p style="margin-top: 20px;">
          <a href="/" class="btn">Back to Home</a>
        </p>
      </div>
      
      <script>{`
(function() {
  var wsUrl = '${wsUrl}';
  var statusEl = document.getElementById('status');
  var detailsEl = document.getElementById('details');
  
  var report = {
    userAgent: navigator.userAgent || 'unknown',
    hasWebSocket: typeof WebSocket !== 'undefined',
    connectAttempted: false,
    connectSuccess: false,
    messageSuccess: false,
    error: null,
    timing: null
  };
  
  function log(msg) {
    detailsEl.textContent += msg + '\\n';
  }
  
  function setStatus(success, msg) {
    statusEl.style.background = success ? '#d4edda' : '#f8d7da';
    statusEl.style.borderColor = success ? '#28a745' : '#dc3545';
    statusEl.textContent = msg;
  }
  
  function sendReport() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/ws-test/report', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(report));
    } catch (e) {
      log('Failed to send report: ' + e.message);
    }
  }
  
  log('User-Agent: ' + report.userAgent);
  log('');
  log('Test 1: WebSocket API exists');
  log('  Result: ' + (report.hasWebSocket ? 'YES' : 'NO'));
  log('');
  
  if (!report.hasWebSocket) {
    setStatus(false, 'WebSocket NOT supported');
    log('WebSocket API not found in this browser.');
    sendReport();
    return;
  }
  
  log('Test 2: WebSocket connection');
  log('  Connecting to: ' + wsUrl);
  
  var startTime = Date.now();
  report.connectAttempted = true;
  
  try {
    var ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      report.timing = Date.now() - startTime;
      report.connectSuccess = true;
      log('  Result: CONNECTED (' + report.timing + 'ms)');
      log('');
      log('Test 3: Message echo');
      log('  Sending: ping');
      ws.send('ping');
    };
    
    ws.onmessage = function(e) {
      log('  Received: ' + e.data);
      if (e.data === 'pong') {
        report.messageSuccess = true;
        log('  Result: SUCCESS');
        setStatus(true, 'WebSocket SUPPORTED!');
      }
      ws.close();
      sendReport();
    };
    
    ws.onerror = function(e) {
      report.error = 'Connection error';
      log('  Error: Connection failed');
      setStatus(false, 'WebSocket connection FAILED');
      sendReport();
    };
    
    ws.onclose = function(e) {
      if (!report.connectSuccess) {
        report.error = 'Connection closed (code: ' + e.code + ')';
        log('  Closed before connecting: code=' + e.code);
        setStatus(false, 'WebSocket connection FAILED');
        sendReport();
      }
    };
    
    setTimeout(function() {
      if (!report.connectSuccess) {
        report.error = 'Connection timeout (5s)';
        log('  Timeout: No response after 5 seconds');
        setStatus(false, 'WebSocket TIMEOUT');
        try { ws.close(); } catch(e) {}
        sendReport();
      }
    }, 5000);
    
  } catch (e) {
    report.error = 'Exception: ' + (e.message || e);
    log('  Exception: ' + report.error);
    setStatus(false, 'WebSocket ERROR');
    sendReport();
  }
})();
      `}</script>
    </Layout>
  );
}
