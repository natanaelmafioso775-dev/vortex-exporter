# 📐 Convenções de Nomenclatura no Figma — Vortex Exporter

Este guia documenta **exatamente** como nomear layers, frames, grupos e componentes no Figma para que o Vortex Exporter reconheça e compile corretamente para Lua MTA.

---

## Índice

1. [Regra de Ouro](#1-regra-de-ouro)
2. [Estrutura Hierárquica no Figma](#2-estrutura-hierárquica-no-figma)
3. [Tabela Completa de Prefixos](#3-tabela-completa-de-prefixos)
4. [Propriedades Opcionais (via nome)](#4-propriedades-opcionais-via-nome)
5. [Animações](#5-animações)
6. [Temas](#6-temas)
7. [Ícones](#7-ícones)
8. [Textos e Labels](#8-textos-e-labels)
9. [Dropdowns e Listas](#9-dropdowns-e-listas)
10. [Hierarquia Visual Final (Lua)](#10-hierarquia-visual-final-lua)
11. [Checklist de Validação](#11-checklist-de-validação)

---

## 1. Regra de Ouro

**Todo componente interativo ou visível DEVE começar com o prefixo `UI_`.**

```
✅ UI_Button(Entrar)
✅ UI_Input(Email)
✅ UI_Title(Bem-vindo)
✅ UI_Window(Login)
❌ Button(Entrar)
❌ MeuBotao
❌ Input1
```

> O sistema de detecção usa `name.startsWith(rule.prefix)` — sem o prefixo, o componente simplesmente **não é reconhecido**.

---

## 2. Estrutura Hierárquica no Figma

```
📁 Página (Frame raiz)
   └── 🖼 UI_Window(Nome)          ← Janela principal
        ├── UI_Title(Titulo)       ← Título
        ├── UI_Input(Email)        ← Campo de input
        ├── UI_Input(Senha)        ← Campo de senha
        ├── UI_Button(Entrar)      ← Botão
        └── UI_Text(Status)        ← Texto de feedback
```

> A **raiz** do seu design deve ser um **Frame** do Figma com o prefixo `UI_Window`.

---

## 3. Tabela Completa de Prefixos

### 🪟 Container / Janela

| Prefixo | Tipo Gerado | Obrigatório | Observação |
|---------|------------|-------------|------------|
| `UI_Window` | `window` | ✅ Frame raiz | Deve ser um **FRAME** no Figma |
| `UI_Frame` | `group` | ❌ | Agrupador visual |

### 🔘 Botões

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Button` | `button` | ✅ Padrão |
| `Btn` | `button` | ✅ Alternativa curta |

### ⌨️ Inputs

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Input` | `input` | ✅ Padrão com todas as props |
| `UI_TextInput` | `input` | ✅ Alternativa simples |

### 📝 Textos

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Text` | `text` | ✅ Texto genérico |
| `UI_Label` | `text` | ✅ Rótulo de campo |
| `UI_Title` | `text` | ✅ Título / Header |

### 🖼️ Imagens

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Image` | `image` | ✅ Padrão |
| `UI_Img` | `image` | ✅ Alternativa curta |

### ✏️ SVG

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_SVG` | `svg` | ✅ Padrão |
| `UI_Svg` | `svg` | ✅ Alternativa |

### 🔽 Dropdown / Select

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Dropdown` | `dropdown` | ✅ Completo |
| `UI_Select` | `dropdown` | ✅ Alternativa |

### ☑️ Checkbox

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Checkbox` | `checkbox` | ✅ Padrão |
| `UI_Check` | `checkbox` | ✅ Alternativa |

### ⚪ Radio Button

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Radio` | `radio` | ✅ Padrão |

### 🔄 Switch / Toggle

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Switch` | `switch` | ✅ Padrão |
| `UI_Toggle` | `switch` | ✅ Alternativa |

### 🎚️ Slider / Range

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Slider` | `slider` | ✅ Padrão |
| `UI_Range` | `slider` | ✅ Alternativa |

### ⏳ Progress / Loading

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Progress` | `progress` | ✅ Barra de progresso |
| `UI_Loading` | `progress` | ✅ Loading spinner/bar |

### 📑 Tabs

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Tabs` | `tabs` | ✅ Abas de navegação |

### 💡 Tooltip

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Tooltip` | `tooltip` | ✅ Dica flutuante |

### 📜 ScrollView

| Prefixo | Tipo Gerado | Uso |
|---------|------------|-----|
| `UI_Scroll` | `scrollview` | ✅ Alternativa curta |
| `UI_ScrollView` | `scrollview` | ✅ Padrão |

---

## 4. Propriedades Opcionais (via nome)

Você pode passar propriedades extras no **nome do layer** usando estes formatos:

### Formato `prop=valor`

```
UI_Button(Entrar) fontSize=16 fontWeight=bold
UI_Input(Email) placeholder="Digite seu email" maxLength=50
UI_Window(Login) theme=dark
```

### Formato `prop:valor`

```
UI_Button: text=Entrar onClick=handleLogin
UI_Title: text=Bem-vindo align=center
```

### Tabela de Propriedades por Tipo

#### `UI_Window` / `UI_Frame`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `title` | Título da janela | `title=Login` |
| `theme` | Tema visual | `theme=dark` |
| `anchor` | Ancoragem na tela | `anchor=center` |
| `responsive` | Se adapta à resolução | `responsive=true` |
| `movable` | Se pode ser arrastada | `movable=true` |
| `resizable` | Se pode ser redimensionada | `resizable=false` |
| `layout` | Layout interno (para Frame) | `layout=vertical` |
| `gap` | Espaçamento entre filhos | `gap=12` |

#### `UI_Button` / `Btn`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Texto do botão | `text=Entrar` |
| `animation` | Animação de entrada | `animation=fadein` |
| `theme` | Tema do botão | `theme=primary` |
| `onClick` | Evento de clique | `onClick=handleLogin` |
| `hoverColor` | Cor no hover (hex) | `hoverColor=#ff0000` |
| `icon` | Ícone inline | `icon=home` |
| `iconPos` | Posição do ícone | `iconPos=left` |
| `loading` | Estado de loading | `loading=true` |
| `fontSize` | Tamanho da fonte | `fontSize=18` |
| `fontWeight` | Peso da fonte | `fontWeight=bold` |
| `disabled` | Estado desabilitado | `disabled=true` |

#### `UI_Input` / `UI_TextInput`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `placeholder` | Texto de placeholder | `placeholder="Digite..."` |
| `masked` | Se é campo de senha | `masked=true` |
| `maxLength` | Limite de caracteres | `maxLength=30` |
| `defaultValue` | Valor inicial | `defaultValue=user@email.com` |
| `animation` | Animação | `animation=slideleft` |
| `theme` | Tema visual | `theme=outline` |
| `prefix` | Texto antes do valor | `prefix=R$` |
| `suffix` | Texto depois do valor | `suffix=kg` |
| `type` | Tipo de input | `type=email` |
| `multiline` | Multi-linha | `multiline=true` |
| `autofocus` | Foco automático | `autofocus=true` |
| `align` | Alinhamento do texto | `align=center` |

#### `UI_Text` / `UI_Label` / `UI_Title`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Conteúdo do texto | `text="Olá mundo"` |
| `fontSize` | Tamanho da fonte | `fontSize=24` |
| `align` | Alinhamento | `align=center` |
| `color` | Cor (hexadecimal) | `color=#ffffff` |
| `animation` | Animação | `animation=fadein` |
| `fontFamily` | Família da fonte | `fontFamily=Arial` |
| `fontWeight` | Peso | `fontWeight=bold` |
| `textCase` | Caixa do texto | `textCase=uppercase` |
| `decoration` | Decoração | `decoration=underline` |
| `letterSpacing` | Espaçamento entre letras | `letterSpacing=2` |
| `lineHeight` | Altura da linha | `lineHeight=1.5` |

#### `UI_Image` / `UI_Img`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `src` | Caminho do asset | `src=logo.png` |
| `animation` | Animação | `animation=zoomin` |
| `scaleMode` | Modo de escala | `scaleMode=cover` |

#### `UI_SVG` / `UI_Svg`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `src` | Caminho do SVG | `src=icon.svg` |
| `animation` | Animação | `animation=rotate` |

#### `UI_Dropdown` / `UI_Select`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label do dropdown | `text=Selecione` |
| `options` | Opções disponíveis | `options=[opcao1,opcao2]` |
| `default` | Valor padrão | `default=opcao1` |
| `searchable` | Com busca | `searchable=true` |
| `maxVisible` | Máx itens visíveis | `maxVisible=5` |
| `theme` | Tema | `theme=primary` |

#### `UI_Checkbox` / `UI_Check`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label do checkbox | `text="Aceito termos"` |
| `default` | Estado inicial | `default=true` |
| `theme` | Tema | `theme=primary` |
| `fontSize` | Tamanho do texto | `fontSize=14` |

#### `UI_Radio`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label do radio | `text=Opção A` |
| `default` | Estado inicial | `default=true` |
| `group` | Grupo de radios | `group=sexo` |
| `theme` | Tema | `theme=primary` |

#### `UI_Switch` / `UI_Toggle`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label do switch | `text=Notificações` |
| `default` | Estado inicial | `default=true` |
| `theme` | Tema | `theme=primary` |
| `activeColor` | Cor quando ativo | `activeColor=#00ff00` |

#### `UI_Slider` / `UI_Range`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `min` | Valor mínimo | `min=0` |
| `max` | Valor máximo | `max=100` |
| `default` | Valor inicial | `default=50` |
| `step` | Incremento | `step=5` |
| `suffix` | Sufixo do valor | `suffix=%` |
| `prefix` | Prefixo do valor | `prefix=R$` |
| `orientation` | Orientação | `orientation=vertical` |
| `showValue` | Mostrar valor | `showValue=true` |
| `format` | Formato do valor | `format=integer` |

#### `UI_Progress` / `UI_Loading`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `min` | Valor mínimo | `min=0` |
| `max` | Valor máximo | `max=100` |
| `default` | Valor inicial | `default=50` |
| `label` | Texto de label | `label=Carregando...` |
| `variant` | Variante visual | `variant=determinate` |
| `thickness` | Espessura da barra | `thickness=8` |
| `showLabel` | Mostrar label | `showLabel=true` |
| `color` | Cor da barra | `color=#00ff00` |
| `trackColor` | Cor do fundo | `trackColor=#333333` |

#### `UI_Tabs`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `tabs` | Nomes das abas | `tabs=[Perfil,Config,Ajuda]` |
| `default` | Aba inicial | `default=0` |
| `position` | Posição das abas | `position=top` |
| `theme` | Tema | `theme=primary` |

#### `UI_Tooltip`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Texto do tooltip | `text="Clique para salvar"` |
| `position` | Posição | `position=top` |
| `delay` | Delay para aparecer (ms) | `delay=500` |
| `maxWidth` | Largura máxima | `maxWidth=200` |
| `theme` | Tema | `theme=dark` |

#### `UI_Scroll` / `UI_ScrollView`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `scrollbar` | Estilo da scrollbar | `scrollbar=thin` |
| `theme` | Tema | `theme=dark` |

---

## 5. Animações

Adicione palavras-chave de animação no nome do componente:

### Fades
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `fadein` | `fadeIn` |
| `fadeout` | `fadeOut` |
| `fade` | `fadeIn` |

### Hover
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `hoverscale` | `hoverScale` |
| `hovercolor` | `hoverColor` |
| `hover` | `hoverScale` |

### Slides
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `slideleft` | `slideLeft` |
| `slideright` | `slideRight` |
| `slideup` | `slideUp` |
| `slidedown` | `slideDown` |
| `slide` | `slideLeft` |

### Zoom
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `zoomin` | `zoomIn` |
| `zoomout` | `zoomOut` |
| `zoom` | `zoomIn` |

### Premium
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `spring` | `spring` |
| `bounce` | `bounce` |
| `elastic` | `elastic` |
| `rotate` | `rotate` |

### Scale
| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `scalein` | `scaleIn` |
| `scaleout` | `scaleOut` |
| `scale` | `scaleIn` |

**Exemplo de uso no nome:**
```
UI_Button(Entrar) fadein
UI_Window(Login) fadein scale
UI_Input hover slideleft
```

---

## 6. Temas

Adicione palavras-chave de tema no nome do componente:

| Palavra-chave | Efeito |
|---------------|--------|
| `primary` | Tema primário |
| `secondary` | Tema secundário |
| `surface` | Tema de superfície |
| `success` | Tema de sucesso (verde) |
| `danger` | Tema de perigo (vermelho) |
| `warning` | Tema de aviso (amarelo) |
| `info` | Tema informativo (azul) |
| `light` | Tema claro |
| `dark` | Tema escuro |
| `accent` | Tema de destaque |
| `error` | Tema de erro |
| `ghost` | Tema fantasma (transparente) |
| `outline` | Tema outline (borda) |
| `gradient` | Tema com gradiente |
| `neon` | Tema neon |
| `glow` | Tema com brilho |
| `glass` | Tema vidro (glassmorphism) |

**Exemplo de uso no nome:**
```
UI_Button(Entrar) primary
UI_Button(Cancelar) ghost
UI_Input(Email) outline
UI_Window(Login) dark
```

---

## 7. Ícones

Adicione nomes de ícone no nome do botão:

| Palavra-chave | Ícone Gerado |
|---------------|--------------|
| `home` | 🏠 |
| `user` | 👤 |
| `settings` | ⚙️ |
| `search` | 🔍 |
| `plus` | + |
| `minus` | - |
| `close` | ✕ |
| `check` | ✓ |
| `arrow-left` | ← |
| `arrow-right` | → |
| `arrow-up` | ↑ |
| `arrow-down` | ↓ |
| `heart` | ♥ |
| `star` | ★ |
| `clock` | ⏱ |
| `calendar` | 📅 |
| `mail` | ✉ |
| `phone` | 📞 |
| `camera` | 📷 |
| `video` | 🎥 |
| `music` | 🎵 |
| `play` | ▶ |
| `pause` | ⏸ |
| `stop` | ⏹ |
| `download` | ⬇ |
| `upload` | ⬆ |
| `trash` | 🗑 |
| `edit` | ✏ |
| `lock` | 🔒 |
| `unlock` | 🔓 |
| `bell` | 🔔 |
| `info` | ℹ |

**Exemplo:**
```
UI_Button(Entrar) user
UI_Button home
UI_Button search
```

---

## 8. Textos e Labels

### Formato com parênteses

O texto visível pode ser definido entre parênteses, colchetes ou chaves:

```
UI_Title(Bem-vindo ao Servidor)
UI_Button(Entrar)
UI_Label[Email:]
```
> O que estiver dentro dos parênteses vira o texto exibido.

### Formato `text=valor`

```
UI_Title text="Bem-vindo"
UI_Button text=Entrar
```

### Regras para `UI_Text` / `UI_Label` / `UI_Title`

- Se você criar um nó **TEXT** no Figma (sem nenhum prefixo), ele será automaticamente detectado como `text`.
- Mas para garantir o controle total, use os prefixos.

---

## 9. Dropdowns e Listas

Para definir opções de um dropdown no nome:

### Formato com colchetes
```
UI_Dropdown(Sexo) options=[Masculino,Feminino,Outro]
```

### Formato com pipe
```
UI_Dropdown(Cidade) options=São Paulo|Rio|BH
```

---

## 10. Hierarquia Visual Final (Lua)

Com base na estrutura do Figma, o exportador gera esta hierarquia em Lua:

```
[BACKGROUND - opacidade 0.5 preto]
   ↓
[UI_Window - card central]
   ↓
[UI_Title - nome do server]
   ↓
[UI_Input - campo de email]
   ↓
[UI_Input - campo de senha (masked)]
   ↓
[UI_Button - botão de login (primary)]
   ↓
[UI_Text - mensagem de status/erro]
```

### Exemplo Completo Funcional

**No Figma (nome dos layers):**
```
📁 LoginPage (FRAME)
   └── 🖼 UI_Window(Login) theme=dark anchor=center
        ├── UI_Title(Vortex RP) align=center
        ├── UI_Input(Email) placeholder="Digite seu email" animation=slideleft
        ├── UI_Input(Senha) placeholder="Digite sua senha" masked=true
        ├── UI_Button(Entrar) theme=primary hoverScale
        └── UI_Text(Não tem conta? Registre-se) fontSize=12 align=center
```

**O que será gerado em Lua (conceito):**
```lua
-- dxDrawRectangle fundo escuro
-- dxDrawRectangle card central
-- dxDrawText "Vortex RP" (título centralizado)
-- dxDrawRectangle input email + placeholder
-- dxDrawRectangle input senha (mascarado)
-- dxDrawRectangle botão com hover effect
-- dxDrawText "Não tem conta? Registre-se"
```

---

## 11. Checklist de Validação

Antes de exportar, verifique:

- [ ] **Frame raiz** tem o prefixo `UI_Window`
- [ ] **Botões** começam com `UI_Button` ou `Btn`
- [ ] **Inputs** começam com `UI_Input` ou `UI_TextInput`
- [ ] **Textos** começam com `UI_Text`, `UI_Label` ou `UI_Title`
- [ ] **Imagens** começam com `UI_Image` ou `UI_Img`
- [ ] **SVGs** começam com `UI_SVG` ou `UI_Svg`
- [ ] Nomes **não têm espaços** no início
- [ ] Propriedades usam formato `prop=valor`
- [ ] Textos entre parênteses `(texto)` para conteúdo visível
- [ ] Componentes têm **largura > 0** e **altura > 0**
- [ ] Janela tem **dimensões entre 1 e 3840** de largura
- [ ] IDs/nomes **não se repetem** (sem duplicatas)
- [ ] Botões com `onClick` usam **nomes de função válidos** (sem espaços, sem caractéres especiais)
- [ ] Inputs têm `placeholder` ou `defaultValue`
- [ ] Cores de tema têm valores RGBA válidos

---

## Resumo Visual

```
┌──────────────────────────────────────────────────────────┐
│                 🎯 REGRA ÚNICA                           │
│                                                          │
│   Todo layer começa com UI_ + Tipo + (texto) props       │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  UI_Window(Login) theme=dark                     │   │
│   │  ├─ UI_Title(Vortex) align=center                │   │
│   │  ├─ UI_Input(Email) placeholder="Digite..."      │   │
│   │  ├─ UI_Input(Senha) masked=true                  │   │
│   │  └─ UI_Button(Entrar) theme=primary hover        │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ✅ Funciona    ❌ Não funciona                         │
│   UI_Button      MeuBotao                                │
│   UI_Input       CampoTexto                              │
│   UI_Window      FramePrincipal                          │
└──────────────────────────────────────────────────────────┘