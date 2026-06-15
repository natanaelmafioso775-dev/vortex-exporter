import * as path from 'path';
import * as fs from 'fs';
import { FigmaClient } from '../core/api/figma';
import { parseFigmaProject } from '../core/parser/parser';
import { validateProject } from '../core/validator/validator';
import { compileToLua } from '../core/compiler/lua-generator';
import { formatLuaCode } from '../core/formatter/lua-formatter';
import { convertPanelJsonToIR, PanelJson } from '../core/compiler/json-to-ir';
import { config } from '../shared/config';

function startApp(): void {
  const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
  const cryptoJS = require('crypto-js');
  const tokenFile = path.join(app.getPath('userData'), 'vortex-token.enc');
  let mainWindow: any = null;

  mainWindow = new BrowserWindow({
    width: 800, height: 600,
    minWidth: 640, minHeight: 480,
    resizable: true, frame: false,
    backgroundColor: '#111827',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'renderer', 'preload.js'),
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
  mainWindow.on('closed', () => { mainWindow = null; });

  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  ipcMain.handle('token-save', async (_e: any, token: string) => {
    try {
      const encrypted = cryptoJS.AES.encrypt(token, config.tokenEncryptionSalt).toString();
      fs.writeFileSync(tokenFile, encrypted, 'utf-8');
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('token-load', async () => {
    try {
      if (!fs.existsSync(tokenFile)) return { success: true, token: '' };
      const enc = fs.readFileSync(tokenFile, 'utf-8');
      const dec = cryptoJS.AES.decrypt(enc, config.tokenEncryptionSalt).toString(cryptoJS.enc.Utf8);
      return { success: true, token: dec };
    } catch { return { success: true, token: '' }; }
  });

  ipcMain.handle('export', async (_e: any, data: { url: string; token: string; outputDir: string }) => {
    try {
      const { url, token, outputDir } = data;
      const fileKey = FigmaClient.extractFileKey(url);
      console.log(`[Vortex] Export started: fileKey=${fileKey}, outputDir=${outputDir}`);
      const parsed = await parseFigmaProject({ url, fileKey, token, outputDir });
      const issues = validateProject(parsed.project);
      const errors = issues.filter((i: any) => i.type === 'error');
      if (errors.length > 0) {
        console.log(`[Vortex] Validation errors: ${errors.length}`);
        return { success: false, step: 'validation', issues: errors.map((x: any) => x.message), warnings: issues.filter((i: any) => i.type === 'warning').map((x: any) => x.message) };
      }
      const compiled = compileToLua(parsed.project);
      const code = formatLuaCode(compiled.code);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const name = parsed.project.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const outPath = path.join(outputDir, `${name}.lua`);
      fs.writeFileSync(outPath, code, 'utf-8');
      console.log(`[Vortex] Export success: ${outPath} (${compiled.lineCount} lines)`);
      return { success: true, outputPath: outPath, panelName: name, lineCount: compiled.lineCount, componentCount: parsed.project.components.length, assetCount: parsed.project.assets.length, warnings: issues.filter((i: any) => i.type === 'warning').map((x: any) => x.message) };
    } catch (err: any) {
      console.error(`[Vortex] Export FAILED:`, err);
      console.error(`[Vortex] Error name:`, err.name);
      console.error(`[Vortex] Error code:`, err.code);
      console.error(`[Vortex] Error details:`, JSON.stringify(err.details || {}));
      console.error(`[Vortex] Error stack:`, err.stack?.substring(0, 500));
      return { success: false, step: 'error', error: `[${err.name || 'Error'}] ${err.message}` }; 
    }
  });

  ipcMain.handle('select-output-dir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { title: 'Select Output Directory', properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? { cancelled: true } : { cancelled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('open-in-explorer', async (_e: any, fp: string) => { shell.showItemInFolder(fp); });

  // ====================================================================
  // COMPILE JSON TEXT - Compila texto JSON diretamente (sem arquivo)
  // ====================================================================
  ipcMain.handle('compile-json-text', async (_e: any, data: { jsonText: string; outputDir: string }) => {
    try {
      const { jsonText, outputDir } = data;
      console.log(`[Vortex] JSON text compile started (${jsonText.length} bytes)`);
      
      const json: PanelJson = JSON.parse(jsonText);
      console.log(`[Vortex] JSON parsed. Window: ${json.window?.width}x${json.window?.height}, Children: ${json.children?.length || 0}`);
      
      const project = convertPanelJsonToIR(json);
      const issues = validateProject(project);
      const errors = issues.filter((i: any) => i.type === 'error');
      
      if (errors.length > 0) {
        console.log(`[Vortex] Validation errors: ${errors.length}`);
        const allIssues = errors.map((x: any) => x.message);
        const warnings = issues.filter((i: any) => i.type === 'warning').map((x: any) => x.message);
        return { success: false, step: 'validation', issues: allIssues, warnings, luaCode: '' };
      }
      
      const compiled = compileToLua(project);
      const code = formatLuaCode(compiled.code);
      
      // Auto-save to output dir
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const name = project.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const outPath = path.join(outputDir, `${name}.lua`);
      fs.writeFileSync(outPath, code, 'utf-8');
      
      console.log(`[Vortex] JSON text compile success: ${outPath} (${compiled.lineCount} lines)`);
      return { success: true, luaCode: code, outputPath: outPath, panelName: name, lineCount: compiled.lineCount, componentCount: project.components.length, warnings: [] };
    } catch (err: any) {
      console.error(`[Vortex] JSON text compile FAILED:`, err.message);
      return { success: false, step: 'error', error: err.message, luaCode: '' };
    }
  });

  // ====================================================================
  // JSON IMPORT - Compila um arquivo JSON de painel para Lua
  // ====================================================================
  ipcMain.handle('import-json', async (_e: any, data: { jsonPath: string; outputDir: string }) => {
    try {
      const { jsonPath, outputDir } = data;
      console.log(`[Vortex] JSON import started: ${jsonPath}`);
      
      if (!fs.existsSync(jsonPath)) {
        return { success: false, error: `File not found: ${jsonPath}` };
      }
      
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      console.log(`[Vortex] JSON file size: ${raw.length} bytes`);
      console.log(`[Vortex] JSON content (first 300 chars):`, raw.substring(0, 300));
      const json: PanelJson = JSON.parse(raw);
      console.log(`[Vortex] JSON parsed. Window: ${json.window?.width}x${json.window?.height}, Children: ${json.children?.length || 0}`);
      
      const project = convertPanelJsonToIR(json);
      const issues = validateProject(project);
      const errors = issues.filter((i: any) => i.type === 'error');
      
      if (errors.length > 0) {
        console.log(`[Vortex] Validation errors: ${errors.length}`);
        return { success: false, step: 'validation', issues: errors.map((x: any) => x.message), warnings: issues.filter((i: any) => i.type === 'warning').map((x: any) => x.message) };
      }
      
      const compiled = compileToLua(project);
      const code = formatLuaCode(compiled.code);
      
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const name = project.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const outPath = path.join(outputDir, `${name}.lua`);
      fs.writeFileSync(outPath, code, 'utf-8');
      
      console.log(`[Vortex] JSON import success: ${outPath} (${compiled.lineCount} lines)`);
      return { success: true, outputPath: outPath, panelName: name, lineCount: compiled.lineCount, componentCount: project.components.length, assetCount: project.assets.length, warnings: issues.filter((i: any) => i.type === 'warning').map((x: any) => x.message) };
    } catch (err: any) {
      console.error(`[Vortex] JSON import FAILED:`, err);
      return { success: false, step: 'error', error: `[${err.name || 'Error'}] ${err.message}` };
    }
  });

  // ====================================================================
  // SELECT JSON FILE - Abre seletor de arquivos .json
  // ====================================================================
  ipcMain.handle('select-json-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Panel JSON File',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });
    return result.canceled ? { cancelled: true } : { cancelled: false, path: result.filePaths[0] };
  });
}

require('electron').app.whenReady().then(startApp);
require('electron').app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') require('electron').app.quit(); 
});