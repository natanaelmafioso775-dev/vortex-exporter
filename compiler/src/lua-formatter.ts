/**
 * Vortex Compiler — Lua Formatter
 * Formata o código Lua gerado para consistência e boas práticas
 */

/**
 * Formata código Lua aplicando indentação consistente e removendo espaços extras
 */
export function formatLua(code: string): string {
  let result = code;

  // Remove linhas em branco duplicadas
  result = result.replace(/\n{3,}/g, '\n\n');

  // Remove trailing whitespace
  result = result.replace(/[ \t]+$/gm, '');

  // Garante uma linha em branco antes de comentários de bloco
  result = result.replace(/(\n)(    --)/g, '\n$2');

  // Garante nova linha no final do arquivo
  if (!result.endsWith('\n')) {
    result += '\n';
  }

  // Garante espaçamento consistente após vírgulas em chamadas de função
  result = result.replace(/,(?=[^\s])/g, ', ');

  return result;
}

/**
 * Adiciona comentários de seção para organizar o código
 */
export function addSectionComments(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let inComponentSection = false;
  let afterWindow = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detecta fim da criação da window
    if (line.includes('panelWindow = UI.Window({') && !afterWindow) {
      result.push(line);
      afterWindow = true;
      continue;
    }

    if (afterWindow && line.trim() === '})') {
      result.push('    })');
      result.push('');
      result.push('    ---- COMPONENTS ----');
      afterWindow = false;
      inComponentSection = true;
      continue;
    }

    // Detecta fim dos componentes (antes do InputManager setup)
    if (inComponentSection && line.includes('UI.InputManager.setCursorEnabled')) {
      result.push('');
      result.push('    ---- INPUT SETUP ----');
      inComponentSection = false;
    }

    // Detecta animação de entrada
    if (line.includes('-- Animação de entrada')) {
      result.push('');
      result.push('    ---- ANIMATION ----');
    }

    result.push(line);
  }

  return result.join('\n');
}