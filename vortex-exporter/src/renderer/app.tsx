import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ===== Types =====
interface ExportData {
  url: string;
  token: string;
  outputDir: string;
}

interface ExportResult {
  success: boolean;
  outputPath?: string;
  luaCode?: string;
  panelName?: string;
  lineCount?: number;
  componentCount?: number;
  assetCount?: number;
  fontCount?: number;
  warnings?: string[];
  error?: string;
  issues?: string[];
  step?: string;
}

type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'validation-error';

type Mode = 'figma' | 'json';

declare global {
  interface Window {
    vortex: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      saveToken: (token: string) => Promise<{ success: boolean; error?: string }>;
      loadToken: () => Promise<{ success: boolean; token: string }>;
      export: (data: ExportData) => Promise<ExportResult>;
      selectOutputDir: () => Promise<{ cancelled: boolean; path?: string }>;
      openInExplorer: (filePath: string) => Promise<void>;
      importJson: (data: { jsonPath: string; outputDir: string }) => Promise<ExportResult>;
      selectJsonFile: () => Promise<{ cancelled: boolean; path?: string }>;
      compileJsonText: (data: { jsonText: string; outputDir: string }) => Promise<ExportResult>;
    };
  }
}

// ===== App Component =====
function App() {
  const [mode, setMode] = useState<Mode>('figma');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [saveToken, setSaveToken] = useState(true);
  const [jsonPath, setJsonPath] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [luaCode, setLuaCode] = useState('');
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Load saved token and default output dir
  useEffect(() => {
    async function load() {
      const tokenResult = await window.vortex.loadToken();
      if (tokenResult.success && tokenResult.token) {
        setToken(tokenResult.token);
      }
      setOutputDir('output');
    }
    load();
  }, []);

  const handleSelectOutputDir = useCallback(async () => {
    const result = await window.vortex.selectOutputDir();
    if (!result.cancelled && result.path) {
      setOutputDir(result.path);
    }
  }, []);

  const handleSelectJsonFile = useCallback(async () => {
    const result = await window.vortex.selectJsonFile();
    if (!result.cancelled && result.path) {
      setJsonPath(result.path);
    }
  }, []);

  const handleExport = useCallback(async () => {
    const validationErrors: string[] = [];
    
    if (mode === 'figma') {
      if (!url.trim()) validationErrors.push('Figma URL is required');
      if (!token.trim()) validationErrors.push('Figma Token is required');
    } else {
      if (!jsonPath.trim()) validationErrors.push('JSON file is required');
    }
    if (!outputDir.trim()) validationErrors.push('Output directory is required');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStatus('error');
      setMessage('Please fill in all required fields');
      return;
    }

    setErrors([]);
    setStatus('loading');
    setMessage(mode === 'figma' ? 'Connecting to Figma API...' : 'Importing JSON file...');
    setResult(null);

    try {
      let exportResult: ExportResult;

      if (mode === 'figma') {
        if (saveToken && token) {
          await window.vortex.saveToken(token);
        }
        exportResult = await window.vortex.export({
          url: url.trim(),
          token: token.trim(),
          outputDir: outputDir.trim(),
        });
      } else {
        exportResult = await window.vortex.importJson({
          jsonPath: jsonPath.trim(),
          outputDir: outputDir.trim(),
        });
      }

      if (exportResult.success) {
        setStatus('success');
        setResult(exportResult);
        setMessage(`Panel "${exportResult.panelName}" exported successfully!`);
      } else if (exportResult.step === 'validation') {
        setStatus('validation-error');
        setMessage('Validation failed');
        setErrors(exportResult.issues || []);
        setResult(exportResult);
      } else {
        setStatus('error');
        setMessage(exportResult.error || 'Unknown error during export');
        setErrors([]);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred');
      setErrors([]);
    }
  }, [mode, url, token, outputDir, saveToken, jsonPath]);

  const handleOpenFile = useCallback(() => {
    if (result?.outputPath) {
      window.vortex.openInExplorer(result.outputPath);
    }
  }, [result]);

  const handleCompileJsonText = useCallback(async () => {
    if (!jsonText.trim()) {
      setErrors(['JSON code is required']);
      setStatus('error');
      setMessage('Paste your JSON code first');
      return;
    }

    setErrors([]);
    setStatus('loading');
    setMessage('Compiling JSON...');
    setResult(null);
    setLuaCode('');

    try {
      const compileResult = await window.vortex.compileJsonText({
        jsonText: jsonText,
        outputDir: outputDir.trim() || 'output',
      });

      if (compileResult.success && compileResult.luaCode) {
        setLuaCode(compileResult.luaCode);
        setStatus('success');
        setResult(compileResult);
        setMessage(`Compiled! ${compileResult.lineCount} lines of Lua`);
      } else if (compileResult.step === 'validation') {
        setStatus('validation-error');
        setMessage('Validation failed');
        setErrors(compileResult.issues || []);
      } else {
        setStatus('error');
        setMessage(compileResult.error || 'Unknown error');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to compile JSON');
    }
  }, [jsonText, outputDir]);

  const copyToClipboard = useCallback(async () => {
    if (luaCode) {
      await navigator.clipboard.writeText(luaCode);
      setMessage('📋 Copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    }
  }, [luaCode]);

  const resetForm = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setResult(null);
    setErrors([]);
  }, []);

  return (
    <>
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-title">
          <span className="logo">✦</span>
          Vortex Exporter
        </div>
        <div className="titlebar-actions">
          <button className="titlebar-btn" onClick={() => window.vortex.minimize()} title="Minimize">─</button>
          <button className="titlebar-btn" onClick={() => window.vortex.maximize()} title="Maximize">□</button>
          <button className="titlebar-btn close" onClick={() => window.vortex.close()} title="Close">✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        <div className="card">
          {/* Header */}
          <div className="card-header">
            <h1>✦ Vortex Exporter v2.0</h1>
            <p>Convert Figma designs into MTA:SA Lua panels</p>
          </div>

          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'figma' ? 'active' : ''}`}
              onClick={() => { setMode('figma'); resetForm(); }}
              disabled={status === 'loading'}
            >
              🌐 Figma URL
            </button>
            <button
              className={`mode-tab ${mode === 'json' ? 'active' : ''}`}
              onClick={() => { setMode('json'); resetForm(); }}
              disabled={status === 'loading'}
            >
              📄 JSON File
            </button>
          </div>

          {/* Figma URL Mode */}
          {mode === 'figma' && (
            <>
              <div className="form-group">
                <label className="form-label">Figma URL</label>
                <input
                  className={`form-input ${status === 'error' && !url ? 'input-error' : ''}`}
                  type="text"
                  placeholder="https://www.figma.com/file/ABC123/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Figma Token</label>
                <input
                  className={`form-input ${status === 'error' && !token ? 'input-error' : ''}`}
                  type="password"
                  placeholder="figd_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>
            </>
          )}

          {/* JSON Editor Mode — 2 painéis: JSON (entrada) + Lua (saída) */}
          {mode === 'json' && (
            <>
              {/* Painel de entrada: JSON */}
              <div className="form-group">
                <label className="form-label">📝 JSON Code (paste aqui)</label>
                <textarea
                  className="form-input editor-textarea"
                  placeholder='Cole seu JSON aqui... ex: {"version":"1.0","window":{"width":400,"height":500},...}'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  disabled={status === 'loading'}
                  rows={8}
                  style={{ resize: 'vertical', minHeight: '120px', fontFamily: 'monospace', fontSize: '11px' }}
                />
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleCompileJsonText}
                disabled={status === 'loading' || !jsonText.trim()}
                style={{ marginBottom: '16px' }}
              >
                {status === 'loading' ? (
                  <><span className="spinner"></span> Compiling...</>
                ) : (
                  '🔧 Compilar JSON → Lua'
                )}
              </button>

              {/* Painel de saída: Lua */}
              <div className="form-group">
                <label className="form-label">📄 Lua Output (copia pro MTA)</label>
                <textarea
                  className="form-input editor-textarea"
                  placeholder="O código Lua aparecerá aqui após compilar..."
                  value={luaCode}
                  readOnly
                  rows={10}
                  style={{
                    resize: 'vertical',
                    minHeight: '150px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    background: '#0d1117',
                    color: '#58a6ff',
                    border: luaCode ? '1px solid #238636' : undefined,
                  }}
                />
                {luaCode && (
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={copyToClipboard}
                    style={{ marginTop: '8px' }}
                  >
                    📋 Copy Lua to Clipboard
                  </button>
                )}
              </div>

              {/* Também mantém opção de arquivo (alternativa) */}
              <div className="form-group" style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Ou selecione um arquivo .json</label>
                <div className="input-with-btn">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Selecionar arquivo..."
                    value={jsonPath}
                    readOnly
                    disabled={status === 'loading'}
                    style={{ fontSize: '11px', height: '32px' }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleSelectJsonFile} disabled={status === 'loading'} style={{ height: '32px', fontSize: '11px' }}>
                    Browse
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Output Folder (both modes) */}
          <div className="form-group">
            <label className="form-label">Output Folder</label>
            <div className="input-with-btn">
              <input
                className={`form-input ${status === 'error' && !outputDir ? 'input-error' : ''}`}
                type="text"
                placeholder="output/"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                disabled={status === 'loading'}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleSelectOutputDir} disabled={status === 'loading'}>
                Browse
              </button>
            </div>
          </div>

          {/* Save Token (Figma mode only) */}
          {mode === 'figma' && (
            <div className="form-group">
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={saveToken}
                  onChange={(e) => setSaveToken(e.target.checked)}
                  disabled={status === 'loading'}
                />
                <span className="checkbox-label">Save token for next use</span>
              </label>
            </div>
          )}

          {/* Export Button */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleExport}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <span className="spinner"></span>
                {mode === 'figma' ? 'Connecting to Figma...' : 'Compiling JSON...'}
              </>
            ) : (
              mode === 'figma' ? '✦ Export from Figma' : '✦ Compile JSON to Lua'
            )}
          </button>

          {/* Progress */}
          {status === 'loading' && (
            <div className="progress-bar">
              <div className="progress-bar-fill"></div>
            </div>
          )}

          {/* Status Messages */}
          {message && status !== 'loading' && (
            <div className={`status status-${status === 'error' || status === 'validation-error' ? 'error' : status}`}>
              <div className="status-header">
                {status === 'success' ? '✓ Export Complete' : 
                 status === 'validation-error' ? '✗ Validation Failed' :
                 status === 'error' ? '✗ Error' : ''}
              </div>
              <div className="status-details">
                {message}
                {errors.length > 0 && (
                  <ul>
                    {errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result?.warnings && result.warnings.length > 0 && (
            <div className="status status-warning">
              <div className="status-header">⚠ Warnings</div>
              <div className="status-details">
                <ul>
                  {result.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Stats */}
          {result?.success && (
            <>
              <div className="result-stats">
                <div className="stat-item">
                  <div className="stat-value">{result.lineCount}</div>
                  <div className="stat-label">Lines of Lua</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{result.componentCount}</div>
                  <div className="stat-label">Components</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{result.assetCount || 0}</div>
                  <div className="stat-label">Assets</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-success btn-full" onClick={handleOpenFile}>
                  📂 Open File Location
                </button>
                <button className="btn btn-secondary btn-full" onClick={resetForm}>
                  New Export
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ===== Mount =====
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}