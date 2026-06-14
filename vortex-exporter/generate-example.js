const path = require('path');
const fs = require('fs');
const { compileToLua } = require('./dist/core/compiler/lua-generator');

const project = {
  version: '1.0.0',
  meta: {
    name: 'LoginPanel',
    sourceFile: 'abc123',
    sourceUrl: 'https://figma.com/file/abc123',
    exportedAt: new Date().toISOString()
  },
  window: {
    width: 400,
    height: 350,
    title: 'Login',
    movable: true,
    anchor: 'center',
    responsive: false,
    theme: 'surface'
  },
  theme: {
    colors: {
      primary: { r: 0, g: 170, b: 255, a: 255, token: 'primary' },
      primaryHover: { r: 0, g: 136, b: 204, a: 255, token: 'primaryHover' },
      surface: { r: 20, g: 20, b: 20, a: 230, token: 'surface' },
      text: { r: 255, g: 255, b: 255, a: 255, token: 'text' },
      textSecondary: { r: 180, g: 180, b: 180, a: 255, token: 'textSecondary' },
      background: { r: 0, g: 0, b: 0, a: 180, token: 'background' }
    }
  },
  components: [
    {
      id: 'txt_title',
      type: 'text',
      x: 20, y: 20, width: 360, height: 40,
      visible: true, opacity: 1, cornerRadius: 0, effects: [], zIndex: 10,
      text: 'Welcome Back', fontSize: 24, align: 'center',
      fontWeight: 700, fontFamily: 'default', color: 'text',
      animation: 'fadeIn'
    },
    {
      id: 'input_user',
      type: 'input',
      x: 40, y: 80, width: 320, height: 42,
      visible: true, opacity: 1, cornerRadius: 4, effects: [], zIndex: 10,
      placeholder: 'Username', masked: false, maxLength: 32,
      defaultValue: '', fontSize: 14,
      animation: 'slideRight', theme: 'surface'
    },
    {
      id: 'input_pass',
      type: 'input',
      x: 40, y: 140, width: 320, height: 42,
      visible: true, opacity: 1, cornerRadius: 4, effects: [], zIndex: 10,
      placeholder: 'Password', masked: true, maxLength: 32,
      defaultValue: '', fontSize: 14,
      animation: 'slideRight', theme: 'surface'
    },
    {
      id: 'btn_login',
      type: 'button',
      x: 40, y: 210, width: 320, height: 46,
      visible: true, opacity: 1, cornerRadius: 8,
      effects: [{ type: 'drop-shadow', radius: 10, offsetX: 0, offsetY: 4, color: { r: 0, g: 0, b: 0, a: 80 } }],
      zIndex: 10,
      text: 'Entrar', onClick: 'onLogin', fontSize: 16,
      animation: 'hoverScale', theme: 'primary'
    }
  ],
  assets: []
};

const result = compileToLua(project);

const outputPath = path.join(__dirname, 'output', 'login_panel.lua');
fs.writeFileSync(outputPath, result.code);

console.log('========================================');
console.log('✅ ARQUIVO GERADO: output/login_panel.lua');
console.log('📊 Linhas: ' + result.lineCount);
console.log('========================================');
console.log('');
console.log('=== PRIMEIRAS 20 LINHAS ===');
const lines = result.code.split('\n');
for (let i = 0; i < Math.min(20, lines.length); i++) {
  console.log(lines[i]);
}
console.log('');
console.log('=== ÚLTIMAS 10 LINHAS ===');
for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
  console.log(lines[i]);
}