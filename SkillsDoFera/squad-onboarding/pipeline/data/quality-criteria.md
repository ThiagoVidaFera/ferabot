# Quality Criteria — Critérios de Qualidade por Entregável

## 1. Página de Vendas HTML

### Critérios de Conteúdo
- [ ] Headline principal inclui resultado específico + número (prazo, valor ou quantidade)
- [ ] Pre-headline identifica o público com pelo menos 2 características específicas
- [ ] História do mentor tem pelo menos: situação anterior + virada + resultado atual
- [ ] Método apresentado tem nome proprietário (não genérico)
- [ ] Mínimo de 8 benefícios listados (focados em transformação, não em features)
- [ ] Mínimo de 3 depoimentos com resultados específicos (números, prazos)
- [ ] Stack de valor com preço de cada item e total
- [ ] Preço do programa apresentado após a construção de valor
- [ ] Mínimo de 3 bônus com valores individuais
- [ ] Garantia com prazo definido e condições claras
- [ ] Urgência/escassez com justificativa real
- [ ] Mínimo de 6 FAQs cobrindo objeções principais
- [ ] CTA aparece em pelo menos 3 pontos diferentes da página

### Critérios Técnicos
- [ ] HTML autossuficiente (zero dependências externas — sem Google Fonts via CDN, sem Bootstrap via CDN)
- [ ] CSS inline ou em tag `<style>` no `<head>`
- [ ] Responsivo (funciona em mobile e desktop)
- [ ] Todas as fontes carregam sem internet (usar system fonts ou @font-face com base64)
- [ ] Imagens como placeholders com cores sólidas (sem imagens externas quebradas)
- [ ] Botões de CTA com cor de destaque (#FF4444 vermelho ou equivalente vibrante)
- [ ] Tempo de leitura estimado: 10-15 minutos para uma venda de alto ticket

### Critérios de Design
- [ ] Hierarquia visual clara: headline > subheadline > corpo
- [ ] Seções com fundo alternado (claro/escuro) para criar ritmo de leitura
- [ ] Espaçamento generoso entre seções (mínimo 80px)
- [ ] Largura máxima de conteúdo: 760px para texto, 1200px para seções visuais
- [ ] Contraste de texto: mínimo 4.5:1 (WCAG AA)

---

## 2. Plano de Marketing Digital HTML

### Critérios de Conteúdo
- [ ] Capa personalizada com nome do cliente e data de criação
- [ ] Diagnóstico atual com análise honesta dos pontos de melhoria
- [ ] Posicionamento definido com nicho específico (não genérico)
- [ ] Mínimo de 3 sugestões de bio para o Instagram
- [ ] Manifesto da marca com 1 parágrafo de identidade forte
- [ ] Mínimo de 10 frases de efeito/taglines personalizadas
- [ ] Estratégia de conteúdo com pilares definidos e frequência
- [ ] Mínimo de 5 sugestões de Reels com roteiros completos
- [ ] Mínimo de 3 sugestões de carrosséis com estrutura slide a slide
- [ ] Mínimo de 3 sugestões de posts estáticos com copy
- [ ] Seção de adaptação da página de vendas para o nicho
- [ ] Calendário editorial de 30 dias preenchido
- [ ] KPIs com metas numéricas específicas para os primeiros 90 dias

### Critérios Técnicos
- [ ] HTML autossuficiente
- [ ] Sumário com âncoras funcionais (links para cada seção)
- [ ] Paginação visual clara entre seções
- [ ] Imprimível (CSS de impressão ou layout que funciona em PDF)

### Critérios de Design
- [ ] Design premium — não parece template genérico
- [ ] Nome do cliente aparece em pelo menos 3 seções para personalização percebida
- [ ] Cores do documento consistentes (2-3 cores de marca)
- [ ] Cada seção tem cabeçalho visual distinto (ícone + título + cor de fundo)

---

## 3. Stories Instagram HTML

### Critérios por Story Individual
- [ ] Viewport configurado para 1080x1920 (ou proporcional — 375x667 com escala)
- [ ] Primeiro elemento visível em menos de 0.5 segundos (sem animação de entrada lenta)
- [ ] Texto legível sem dar zoom (mínimo 32px em mobile)
- [ ] CTA claro presente (mesmo que implícito) em cada story
- [ ] Identidade visual consistente (paleta, fonte, estilo) entre todos os 10 stories
- [ ] Story não depende do story anterior para fazer sentido (exceto quando sequência intencional)

### Critérios de Conjunto (10 stories)
- [ ] Mínimo 2 stories de autoridade/prova social
- [ ] Mínimo 2 stories educativos (entrega valor antes de vender)
- [ ] Mínimo 1 story de identificação com o problema
- [ ] Mínimo 1 story de apresentação da solução
- [ ] Mínimo 1 story com CTA explícito para a página de vendas
- [ ] Variedade de formatos (texto puro, imagem + texto, pergunta, revelação)

### Critérios Técnicos
- [ ] Cada story em arquivo HTML separado
- [ ] Nomeados sequencialmente: `{client-slug}-story-01.html` a `{client-slug}-story-10.html`
- [ ] Autossuficientes individualmente

---

## 4. Carrosséis Instagram HTML

### Critérios por Carrossel
- [ ] Slide 1 (capa) tem promessa que gera curiosidade suficiente para deslizar
- [ ] Último slide tem CTA claro para a página de vendas ou bio
- [ ] Consistência visual entre todos os slides do mesmo carrossel
- [ ] Cada slide tem no máximo 3 elementos textuais (título + corpo + detalhe)
- [ ] Texto bold e espaçado — escaneável em menos de 5 segundos por slide
- [ ] Progressão lógica entre slides (um leva ao próximo)

### Critérios de Conjunto (3 carrosséis)
- [ ] Temas diferentes entre os 3 (não repetir o mesmo ângulo)
- [ ] Formatos diferentes (listicle, passo a passo, antes/depois)
- [ ] Cada carrossel tem entre 6 e 12 slides

### Critérios Técnicos
- [ ] Slides apresentados em sequência vertical no arquivo HTML (para screenshot)
- [ ] Cada slide tem `width: 1080px; height: 1080px` (proporção 1:1)
- [ ] Nomeados: `{client-slug}-carousel-01.html` a `{client-slug}-carousel-03.html`

---

## 5. Thumbnails YouTube HTML

### Critérios por Thumbnail
- [ ] Dimensões: 1280x720px
- [ ] Texto com no máximo 5 palavras (legível até em 200px de largura)
- [ ] Contraste texto/fundo: nível AAA (7:1) para máxima legibilidade
- [ ] Emoção clara — o design transmite urgência, curiosidade ou benefício
- [ ] Espaço visual para rosto/foto do mentor (mesmo que como placeholder)
- [ ] Cores que se destacam no fundo cinza do YouTube (evitar branco puro ou cinza)

### Critérios de Conjunto (3 thumbnails)
- [ ] Temas alinhados com os carrosséis ou conteúdo do plano de marketing
- [ ] Consistência de marca entre as 3 thumbnails
- [ ] Variedade de composição (não todas iguais em layout)

### Critérios Técnicos
- [ ] `width: 1280px; height: 720px` fixo no CSS
- [ ] Nomeados: `{client-slug}-thumb-01.html` a `{client-slug}-thumb-03.html`
- [ ] HTML autossuficiente

---

## 6. Deploy Netlify

### Critérios de Sucesso
- [ ] NETLIFY_AUTH_TOKEN verificado antes de tentar o deploy
- [ ] Slug do cliente gerado corretamente (minúsculas, sem espaços, sem acentos)
- [ ] Página de vendas publicada com URL no formato `{client-slug}-vendas.netlify.app`
- [ ] URL de deploy salva no outputFile
- [ ] Erro de deploy capturado e reportado claramente se falhar

---

## 7. Upload Google Drive

### Critérios de Sucesso
- [ ] Pasta criada com o nome do cliente na pasta-mãe configurada
- [ ] Todos os arquivos HTML do run carregados
- [ ] Link da pasta criada salvo no outputFile
- [ ] Erro de upload reportado claramente se falhar
- [ ] Verificação de que os arquivos foram carregados com sucesso (contagem de itens)
