# 📺 Guia: Adicionar Dashboards e Links Internos nas Playlists

## ✅ Funcionalidade Disponibilizada

O sistema **PlaySync** agora suporta a adição de **links internos, dashboards e sistemas web** diretamente nas playlists para exibição nas TVs.

### O que você pode adicionar:

✅ **Dashboards internos** (ex: `http://172.23.238.193:8888/sga/painel/SIGA?setor=0`)  
✅ **Sistemas web internos** (qualquer URL HTTP/HTTPS)  
✅ **YouTube** (vídeos normais e lives)  
✅ **Vídeos diretos** (links .mp4, .webm, etc.)  
✅ **Imagens diretas** (links .jpg, .png, etc.)  
✅ **Google Drive, SharePoint, etc.**  
✅ **Qualquer site que permita iframe**

---

## 🚀 Como Adicionar Links Internos

### Método 1: Editor de Playlist (Recomendado)

1. **Acesse o Editor:**
   - Vá para `Dashboard` → `Playlists` → Clique em uma playlist → `Editar`

2. **Adicione o URL:**
   - No campo de URL, cole o link do sistema interno:

   ```
   http://172.23.238.193:8888/sga/painel/SIGA?setor=0
   ```

3. **Detecção Automática:**
   O sistema detecta automaticamente o tipo de conteúdo:
   - URLs do YouTube → Tipo `youtube`
   - URLs terminando em `.mp4`, `.webm`, etc. → Tipo `video`
   - URLs terminando em `.jpg`, `.png`, etc. → Tipo `image`
   - **Qualquer outra URL** → Tipo `web` (iframe) ✅

4. **Configure a Duração:**
   - Defina por quanto tempo o dashboard ficará na tela (ex: 30 segundos, 1 minuto)

5. **Salve:**
   - Clique em "Salvar" e o item será adicionado à playlist

### Método 2: Zone Composer (Layouts Múltiplos)

1. No editor, selecione um layout com múltiplas zonas
2. Clique em uma zona vazia
3. Cole o URL do dashboard
4. O conteúdo será exibido naquela zona específica

---

## 🔊 Suporte a Áudio

**Links internos COM som funcionam!** O sistema suporta:

✅ Áudio de dashboards interativos  
✅ Vídeos com som incorporados  
✅ Sistemas com alertas sonoros  
✅ Notificações de áudio

### Configurações de Áudio:

- **Mudo Global:** Você pode silenciar tudo no player com o botão de mute
- **Áudio por Item:** Cada item pode ter configurações individuais
- **Autoplay:** Áudio começa automaticamente quando o item é exibido

---

## 📋 Exemplos de Uso

### Exemplo 1: Dashboard de Produção

```
URL: http://172.23.238.193:8888/sga/painel/SIGA?setor=0
Duração: 30 segundos
Tipo: web (detectado automaticamente)
```

### Exemplo 2: Painel de Métricas

```
URL: http://10.0.0.50:3000/dashboard/production
Duração: 45 segundos
Tipo: web
```

### Exemplo 3: YouTube Live

```
URL: https://www.youtube.com/watch?v=abc123xyz
Duração: Até terminar (ou defina um limite)
Tipo: youtube (detectado automaticamente)
```

### Exemplo 4: Câmera IP

```
URL: http://192.168.1.100/stream
Duração: 60 segundos
Tipo: web
```

---

## ⚙️ Configurações Avançadas

### Duração Personalizada

Cada item pode ter uma duração diferente:

- **Dashboards estáticos:** 15-30 segundos
- **Dashboards dinâmicos:** 30-60 segundos
- **Vídeos:** Duração do vídeo ou limite personalizado
- **YouTube:** Até terminar ou tempo definido

### Rotação de Tela

Você pode definir rotação para cada item:

- `0°` - Normal
- `90°` - Retrato
- `180°` - Invertido
- `270°` - Retrato invertido

### Agendamento

Defina quando cada item deve aparecer:

- **Data de início/fim**
- **Horário específico**
- **Dias da semana**
- **Dia inteiro ou horário personalizado**

---

## ⚠️ Considerações Importantes

### 1. Sites que Bloqueiam iframe

Alguns sites **não podem ser exibidos em iframe** por segurança:

- ❌ Google (www.google.com)
- ❌ Facebook
- ❌ Alguns sites corporativos com `X-Frame-Options: DENY`

**Solução:** Use dashboards internos que não tenham essa restrição.

### 2. Autenticação

Se o sistema interno requer login:

- ✅ **Mesma rede:** Se a TV está na mesma rede e já tem acesso, funciona
- ❌ **Login necessário:** Se requer autenticação a cada sessão, pode não carregar

**Solução:** Configure o sistema interno para permitir acesso sem login na rede local.

### 3. HTTPS Misto

Se seu PlaySync usa HTTPS mas o dashboard é HTTP:

- Pode haver avisos de "conteúdo misto"
- **Solução:** Use ambos HTTP ou ambos HTTPS

### 4. Performance

Dashboards muito pesados podem demorar para carregar:

- Otimize o dashboard para carregamento rápido
- Evite dashboards com muitos dados em tempo real
- Considere aumentar a duração de exibição

---

## 🎯 Playlist de Exemplo Completa

```
Playlist: "TV Chão de Fábrica"

1. Dashboard de Produção (SIGA)
   URL: http://172.23.238.193:8888/sga/painel/SIGA?setor=0
   Duração: 30s
   Tipo: web

2. Métricas de Qualidade
   URL: http://10.0.0.50:3000/quality
   Duração: 45s
   Tipo: web

3. Vídeo de Treinamento
   URL: https://youtube.com/watch?v=training123
   Duração: 5min
   Tipo: youtube

4. Alertas e Notificações
   URL: http://172.23.238.193:8888/alerts
   Duração: 20s
   Tipo: web (COM SOM)

5. Câmera da Linha de Produção
   URL: http://192.168.1.100/stream
   Duração: 60s
   Tipo: web
```

---

## 🔧 Solução de Problemas

### Dashboard não carrega

**Problema:** Tela fica branca ou carregando eternamente

**Causas possíveis:**

1. Dashboard bloqueia iframe
2. URL inacessível da rede da TV
3. Dashboard requer autenticação

**Soluções:**

- Teste o URL no navegador da TV
- Verifique se o dashboard permite iframe
- Configure acesso sem login para a rede local

### Sem áudio

**Problema:** Dashboard tem som mas não toca

**Verifique:**

1. Botão de mute no player está desligado
2. Volume da TV está ligado
3. Dashboard permite autoplay de áudio

**Solução:**

- No dashboard, configure áudio para autoplay
- Verifique configurações de som do sistema

### Layout quebrado

**Problema:** Dashboard aparece cortado ou distorcido

**Solução:**

- Ajuste rotação do item
- Use layout adequado (full screen recomendado)
- Otimize dashboard para resolução da TV

---

## 📞 Suporte

Se precisar de ajuda:

1. Verifique os logs do navegador (F12 → Console)
2. Teste o URL diretamente no navegador da TV
3. Verifique se a TV tem acesso à rede do dashboard

---

## ✨ Melhorias Recentes

### Detecção Automática de URLs

O sistema agora detecta automaticamente:

- ✅ YouTube (vídeos e lives)
- ✅ Vídeos diretos (.mp4, .webm, .ogg, .mov)
- ✅ Imagens diretas (.jpg, .png, .gif, .webp)
- ✅ **Web/iframe (qualquer outra URL)** ← NOVO!

### Permissões de Iframe Aprimoradas

Adicionado suporte para:

- ✅ Autoplay de áudio
- ✅ Scripts interativos
- ✅ Popups e formulários
- ✅ Apresentações
- ✅ Modais

---

**Versão:** 1.0  
**Última atualização:** Junho 2026
