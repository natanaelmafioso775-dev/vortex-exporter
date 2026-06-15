# 📐 Convenções de Nomenclatura no Figma — Vortex Exporter

Este guia documenta **exatamente** como nomear layers no Figma para que o Vortex Exporter reconheça e compile para Lua MTA.

---

## 🔥 REFERÊNCIA RÁPIDA (copia e cola)

### Estrutura básica de um painel

```
📁 Página
   └── 🖼 UI_Window(Login) anchor=center theme=dark
        ├── UI_Title(Vortex RP) align=center
        ├── UI_Input(Email) placeholder="Digite seu email"
        ├── UI_Input(Senha) placeholder="Digite sua senha" masked=true
        ├── UI_Button(Entrar) theme=primary hover
        └── UI_Text(Não tem conta?) fontSize=12 align=center
```

### Com overlay (fundo escuro opcional)

```
📁 Página
   ├── 🖼 UI_Background   ← overlay opcional atrás da window
   └── 🖼 UI_Window(Login) anchor=center
```

### Sem overlay

```
📁 Página
   └── 🖼 UI_Window(Login) anchor=center
```

### Centralizar na tela

```
UI_Window(Nome do Painel) anchor=center
```

### Criar uma área com scroll

```
📁 Página
   └── 🖼 UI_Window(Shop) anchor=center
        ├── UI_Title(Loja) align=center
        ├── 🖼 UI_Scroll scrollbar=thin   ← container com scroll
        │    ├── UI_Button(Item 1)
        │    ├── UI_Button(Item 2)
        │    ├── UI_Button(Item 3)
        │    └── UI_Button(Item 4)
        └── UI_Text(Total) fontSize=12
```

O `UI_Scroll` precisa ser um **Frame** no Figma com altura menor que o conteúdo interno para o scroll aparecer. ⚠️ Scroll com mouse wheel precisa ser implementado manualmente no Lua gerado.

---

### Posicionar em coordenadas fixas (pixels)

```
UI_Window(Nome) x=760 y=231
```

> ⚠️ Só funciona na resolução que você definiu. Prefira `anchor=` para suportar qualquer resolução.

---

## Índice

1. [Tamanho do Canvas](#0-tamanho-do-canvas-importante)
2. [Regra de Ouro](#1-regra-de-ouro)
3. [Tabela Completa de Prefixos](#2-tabela-completa-de-prefixos)
4. [Posicionamento e Âncora](#3-posicionamento-e-âncora)
5. [Propriedades Opcionais (via nome)](#4-propriedades-opcionais-via-nome)
6. [Animações](#5-animações)
7. [Temas](#6-temas)
8. [Ícones](#7-ícones)
9. [Textos e Labels](#8-textos-e-labels)
10. [Dropdowns e Listas](#9-dropdowns-e-listas)
11. [Escala Responsiva](#10-escala-responsiva)
12. [Checklist de Validação](#11-checklist-de-validação)

---

## 0. Tamanho do Canvas (IMPORTANTE)

**Use um Frame de referência `1366 × 768` no Figma.**

```
✅ Frame: 1366 × 768
❌ Frame: 1920 × 1080
```

**Por quê?** O GTA San Andreas / MTA roda principalmente em resoluções HD (1366×768) ou 720p (1280×720). Painéis desenhados em Full HD (1920×1080) ficam pequenos demais nessas resoluções.

### Tamanhos recomendados para painéis comuns:

| Tipo de Painel | Largura | Altura |
|---------------|---------|--------|
| Login / Registro | 380–420 | 400–500 |
| Inventário / Mochila | 600–700 | 500–600 |
| Loja / Compras | 700–800 | 550–650 |
| Configurações | 500–600 | 450–550 |
| Banco / ATM | 350–400 | 350–450 |
| Seleção de Personagem | 800–900 | 500–600 |
| Chat / Mensagens | 400–500 | 350–450 |

---

## 1. Regra de Ouro

**Todo layer DEVE começar com `UI_` para ser reconhecido.**

```
✅ UI_Button(Entrar)
✅ UI_Input(Email)
✅ UI_Title(Bem-vindo)
✅ UI_Window(Login)
✅ UI_Background
❌ Button(Entrar)
❌ Input1
❌ FundoEscuro
```

> O sistema de detecção usa `name.startsWith(prefix)` — sem o prefixo `UI_`, **não funciona**.

---

## 2. Tabela Completa de Prefixos

### 🪟 Container / Janela

| Prefixo | Tipo Gerado | Obrigatório | Observação |
|---------|------------|-------------|------------|
| `UI_Window` | `window` | ✅ Frame principal | Deve ser um **FRAME** no Figma |
| `UI_Background` | `background` | ❌ | Overlay opcional atrás da window |
| `UI_Frame` | `group` | ❌ | Agrupador visual |

### 🔘 Botões

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Button` | `button` | ✅ Padrão |
| `Btn` | `button` | ✅ Alternativa curta |

### ⌨️ Inputs

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Input` | `input` | ✅ Padrão |
| `UI_TextInput` | `input` | ✅ Alternativa |

### 📝 Textos

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Text` | `text` | ✅ Texto genérico |
| `UI_Label` | `text` | ✅ Rótulo de campo |
| `UI_Title` | `text` | ✅ Título / Header |

### 🖼️ Imagens

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Image` | `image` | ✅ Padrão |
| `UI_Img` | `image` | ✅ Alternativa curta |

### ✏️ SVG

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_SVG` | `svg` | ✅ Padrão |
| `UI_Svg` | `svg` | ✅ Alternativa |

### 🔽 Dropdown

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Dropdown` | `dropdown` | ✅ Completo |
| `UI_Select` | `dropdown` | ✅ Alternativa |

### ☑️ Checkbox

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Checkbox` | `checkbox` | ✅ Padrão |
| `UI_Check` | `checkbox` | ✅ Alternativa |

### ⚪ Radio

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Radio` | `radio` | ✅ Padrão |

### 🔄 Switch

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Switch` | `switch` | ✅ Padrão |
| `UI_Toggle` | `switch` | ✅ Alternativa |

### 🎚️ Slider

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Slider` | `slider` | ✅ Padrão |
| `UI_Range` | `slider` | ✅ Alternativa |

### ⏳ Progress

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Progress` | `progress` | ✅ Barra de progresso |
| `UI_Loading` | `progress` | ✅ Loading |

### 📑 Tabs

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Tabs` | `tabs` | ✅ Abas |

### 💡 Tooltip

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Tooltip` | `tooltip` | ✅ Dica flutuante |

### 📜 ScrollView

| Prefixo | Tipo Gerado | Cópia |
|---------|------------|-------|
| `UI_Scroll` | `scrollview` | ✅ Alternativa curta |
| `UI_ScrollView` | `scrollview` | ✅ Padrão |

---

## 3. Posicionamento e Âncora

### Âncoras (recomendado — funciona em qualquer resolução)

Use `anchor=` no nome da `UI_Window`:

| Âncora | Posição na tela | Cópia |
|--------|----------------|-------|
| `center` | Centro da tela | `UI_Window(Login) anchor=center` |
| `left` | Esquerda, centro vertical | `UI_Window(Shop) anchor=left` |
| `right` | Direita, centro vertical | `UI_Window(Config) anchor=right` |
| `top` | Topo, centro horizontal | `UI_Window(Top) anchor=top` |
| `bottom` | Baixo, centro horizontal | `UI_Window(Bottom) anchor=bottom` |
| `topleft` | Canto superior esquerdo | `UI_Window(Info) anchor=topleft` |
| `topright` | Canto superior direito | `UI_Window(Notif) anchor=topright` |
| `bottomleft` | Canto inferior esquerdo | `UI_Window(Minimap) anchor=bottomleft` |
| `bottomright` | Canto inferior direito | `UI_Window(Stats) anchor=bottomright` |

### Coordenadas X/Y em pixels

Use `x=` e `y=` para posicionamento fixo:

```
UI_Window(Login) x=760 y=231
```

> ⚠️ Só funciona na resolução que você desenhou. Prefira `anchor=` pra ser universal.

### Sobrescrita de posição

Se você usar **ambos** (`x=` + `anchor=`), o `x=`/`y=` tem prioridade.

---

## 4. Propriedades Opcionais (via nome)

Passe propriedades no nome do layer:

```
prop=valor
prop:valor
```

### `UI_Window` / `UI_Frame`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `title` | Título da janela | `title=Login` |
| `theme` | Tema visual | `theme=dark` |
| `anchor` | Ancoragem na tela | `anchor=center` |
| `x` | Posição X em pixels | `x=760` |
| `y` | Posição Y em pixels | `y=231` |
| `responsive` | Escala automática | `responsive=true` |
| `movable` | Arrastável | `movable=true` |
| `resizable` | Redimensionável | `resizable=false` |
| `layout` | Layout interno | `layout=vertical` |
| `gap` | Espaçamento entre filhos | `gap=12` |

### `UI_Button` / `Btn`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Texto do botão | `text=Entrar` |
| `animation` | Animação | `animation=fadein` |
| `theme` | Tema | `theme=primary` |
| `onClick` | Evento de clique | `onClick=handleLogin` |
| `hoverColor` | Cor no hover | `hoverColor=#ff0000` |
| `icon` | Ícone inline | `icon=home` |
| `iconPos` | Posição do ícone | `iconPos=left` |
| `loading` | Estado de loading | `loading=true` |
| `fontSize` | Tamanho da fonte | `fontSize=18` |
| `fontWeight` | Peso da fonte | `fontWeight=bold` |
| `disabled` | Estado desabilitado | `disabled=true` |

### `UI_Input` / `UI_TextInput`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `placeholder` | Texto de placeholder | `placeholder="Digite..."` |
| `masked` | Campo de senha | `masked=true` |
| `maxLength` | Limite de caracteres | `maxLength=30` |
| `defaultValue` | Valor inicial | `defaultValue=user@email.com` |
| `animation` | Animação | `animation=slideleft` |
| `theme` | Tema visual | `theme=outline` |
| `prefix` | Texto antes do valor | `prefix=R$` |
| `suffix` | Texto depois do valor | `suffix=kg` |
| `multiline` | Multi-linha | `multiline=true` |
| `autofocus` | Foco automático | `autofocus=true` |
| `align` | Alinhamento | `align=center` |

### `UI_Text` / `UI_Label` / `UI_Title`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Conteúdo | `text="Olá mundo"` |
| `fontSize` | Tamanho | `fontSize=24` |
| `align` | Alinhamento | `align=center` |
| `color` | Cor (hex) | `color=#ffffff` |
| `animation` | Animação | `animation=fadein` |
| `fontFamily` | Família | `fontFamily=Arial` |
| `fontWeight` | Peso | `fontWeight=bold` |
| `textCase` | Caixa | `textCase=uppercase` |
| `decoration` | Decoração | `decoration=underline` |
| `letterSpacing` | Espaçamento letras | `letterSpacing=2` |
| `lineHeight` | Altura da linha | `lineHeight=1.5` |

### `UI_Image` / `UI_Img`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `src` | Caminho do asset | `src=logo.png` |
| `animation` | Animação | `animation=zoomin` |
| `scaleMode` | Modo de escala | `scaleMode=cover` |

### `UI_SVG` / `UI_Svg`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `src` | Caminho do SVG | `src=icon.svg` |
| `animation` | Animação | `animation=rotate` |

### `UI_Dropdown` / `UI_Select`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label | `text=Selecione` |
| `options` | Opções | `options=[A,B,C]` |
| `default` | Valor padrão | `default=opcao1` |
| `searchable` | Com busca | `searchable=true` |
| `maxVisible` | Máx visíveis | `maxVisible=5` |
| `theme` | Tema | `theme=primary` |

### `UI_Checkbox` / `UI_Check`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label | `text="Aceito termos"` |
| `default` | Estado inicial | `default=true` |
| `theme` | Tema | `theme=primary` |
| `fontSize` | Tamanho texto | `fontSize=14` |

### `UI_Radio`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label | `text=Opção A` |
| `default` | Estado inicial | `default=true` |
| `group` | Grupo de radios | `group=sexo` |
| `theme` | Tema | `theme=primary` |

### `UI_Switch` / `UI_Toggle`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Label | `text=Notificações` |
| `default` | Estado inicial | `default=true` |
| `theme` | Tema | `theme=primary` |
| `activeColor` | Cor ativo | `activeColor=#00ff00` |

### `UI_Slider` / `UI_Range`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `min` | Valor mínimo | `min=0` |
| `max` | Valor máximo | `max=100` |
| `default` | Valor inicial | `default=50` |
| `step` | Incremento | `step=5` |
| `suffix` | Sufixo | `suffix=%` |
| `prefix` | Prefixo | `prefix=R$` |
| `orientation` | Orientação | `orientation=vertical` |
| `showValue` | Mostrar valor | `showValue=true` |

### `UI_Progress` / `UI_Loading`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `min` | Mínimo | `min=0` |
| `max` | Máximo | `max=100` |
| `default` | Valor inicial | `default=50` |
| `label` | Texto | `label=Carregando...` |
| `variant` | Variante | `variant=determinate` |
| `thickness` | Espessura | `thickness=8` |
| `showLabel` | Mostrar label | `showLabel=true` |
| `color` | Cor da barra | `color=#00ff00` |
| `trackColor` | Cor do fundo | `trackColor=#333333` |

### `UI_Tabs`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `tabs` | Nomes das abas | `tabs=[Perfil,Config]` |
| `default` | Aba inicial | `default=0` |
| `position` | Posição | `position=top` |
| `theme` | Tema | `theme=primary` |

### `UI_Tooltip`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `text` | Texto | `text="Clique para salvar"` |
| `position` | Posição | `position=top` |
| `delay` | Delay (ms) | `delay=500` |
| `maxWidth` | Largura máxima | `maxWidth=200` |
| `theme` | Tema | `theme=dark` |

### `UI_Scroll` / `UI_ScrollView`

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `scrollbar` | Estilo | `scrollbar=thin` |
| `theme` | Tema | `theme=dark` |

---

## 5. Animações

Adicione no nome do componente:

```
UI_Button(Entrar) fadein
UI_Button hover
UI_Window(Login) fadein scale
UI_Input slideleft
```

| Palavra-chave | Animação Gerada |
|---------------|----------------|
| `fadein` | `fadeIn` |
| `fadeout` | `fadeOut` |
| `fade` | `fadeIn` |
| `hover` / `hoverscale` | `hoverScale` |
| `hovercolor` | `hoverColor` |
| `slideleft` | `slideLeft` |
| `slideright` | `slideRight` |
| `slideup` | `slideUp` |
| `slidedown` | `slideDown` |
| `slide` | `slideLeft` |
| `zoomin` | `zoomIn` |
| `zoomout` | `zoomOut` |
| `zoom` | `zoomIn` |
| `spring` | `spring` |
| `bounce` | `bounce` |
| `elastic` | `elastic` |
| `rotate` | `rotate` |
| `scalein` | `scaleIn` |
| `scaleout` | `scaleOut` |
| `scale` | `scaleIn` |

---

## 6. Temas

Adicione `theme=` no nome:

```
UI_Button(Entrar) theme=primary
UI_Button(Cancelar) theme=ghost
UI_Input(Email) theme=outline
UI_Window(Login) theme=dark
```

| Palavra-chave | Efeito |
|---------------|--------|
| `primary` | Primário (azul) |
| `secondary` | Secundário (cinza) |
| `success` | Sucesso (verde) |
| `danger` | Perigo (vermelho) |
| `warning` | Aviso (amarelo) |
| `info` | Informativo (azul claro) |
| `light` | Claro |
| `dark` | Escuro |
| `ghost` | Fantasma (transparente) |
| `outline` | Outline (borda) |
| `neon` | Neon |
| `glow` | Brilho |
| `glass` | Vidro (glassmorphism) |
| `gradient` | Gradiente |
| `accent` | Destaque |
| `error` | Erro |
| `surface` | Superfície |

---

## 7. Ícones

Adicione o nome do ícone no botão:

```
UI_Button(Entrar) user
UI_Button home
UI_Button search
```

| Palavra | Ícone |
|---------|-------|
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
| `play` | ▶ |
| `pause` | ⏸ |
| `download` | ⬇ |
| `upload` | ⬆ |
| `trash` | 🗑 |
| `edit` | ✏ |
| `lock` | 🔒 |
| `unlock` | 🔓 |
| `bell` | 🔔 |
| `info` | ℹ |

---

## 8. Textos e Labels

### Parênteses (texto visível)

```
UI_Title(Bem-vindo ao Servidor)
UI_Button(Entrar)
UI_Label[Email:]
```

### Formato text=valor

```
UI_Title text="Bem-vindo"
UI_Button text=Entrar
```

---

## 9. Dropdowns e Listas

### Colchetes
```
UI_Dropdown(Sexo) options=[Masculino,Feminino,Outro]
```

### Pipe
```
UI_Dropdown(Cidade) options=São Paulo|Rio|BH
```

---

## 10. Escala Responsiva

Se você desenhou o painel em **1366×768** mas quer que ele escale para qualquer resolução:

```
UI_Window(Login) responsive=true anchor=center
```

O sistema calcula: `scale = min(telaLargura / 1366, telaAltura / 768)`

Isso garante que o painel fique proporcional em monitores Full HD, 1440p ou superiores.

> ❌ Sem `responsive`: o painel mantém o tamanho exato que você desenhou.
> ✅ Com `responsive=true`: o painel escala proporcionalmente.

---

## 11. Checklist de Validação

Antes de exportar, confira:

- [ ] **Frame raiz** é `UI_Window`
- [ ] **Botões** começam com `UI_Button` ou `Btn`
- [ ] **Inputs** começam com `UI_Input` ou `UI_TextInput`
- [ ] **Textos** começam com `UI_Text`, `UI_Label` ou `UI_Title`
- [ ] **Imagens** começam com `UI_Image` ou `UI_Img`
- [ ] **SVGs** começam com `UI_SVG` ou `UI_Svg`
- [ ] **Background** (opcional) é `UI_Background`
- [ ] Sem espaços no início dos nomes
- [ ] Propriedades usam `prop=valor`
- [ ] Textos entre parênteses `(texto)`
- [ ] Componentes têm largura > 0 e altura > 0
- [ ] Janela entre 1 e 3840 de largura
- [ ] IDs/nomes não se repetem
- [ ] Inputs têm placeholder ou defaultValue

---

## Resumo Visual

```
┌──────────────────────────────────────────────────────────┐
│                 🎯 REGRA ÚNICA                           │
│                                                          │
│   Todo layer começa com UI_ + Tipo + (texto) props       │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  UI_Window(Login) anchor=center theme=dark       │   │
│   │  ├─ UI_Title(Vortex) align=center                │   │
│   │  ├─ UI_Input(Email) placeholder="Digite..."      │   │
│   │  ├─ UI_Input(Senha) masked=true                  │   │
│   │  └─ UI_Button(Entrar) theme=primary hover        │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ✅ Funciona      ❌ Não funciona                       │
│   UI_Button        MeuBotao                               │
│   UI_Window        FramePrincipal                         │
│   UI_Background    FundoEscuro                            │
│   UI_Input         CampoTexto                             │
└──────────────────────────────────────────────────────────┘