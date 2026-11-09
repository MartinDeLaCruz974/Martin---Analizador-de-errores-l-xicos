/**
 * Analizador de Errores: Léxico, Sintáctico y Semántico
 * Controlador principal de la aplicación web (app.js)
 * Asignatura: Autómatas I / Compiladores
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const languageSelect = document.getElementById('languageSelect');
  const codeEditor = document.getElementById('codeEditor');
  const lineNumbers = document.getElementById('lineNumbers');
  const editorContainer = document.getElementById('editorContainer');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');

  // Botones de presets de código
  const loadValidBtn = document.getElementById('loadValidBtn');
  const loadLexicalBtn = document.getElementById('loadLexicalBtn');
  const loadSyntacticBtn = document.getElementById('loadSyntacticBtn');
  const loadSemanticBtn = document.getElementById('loadSemanticBtn');
  const loadAllBtn = document.getElementById('loadAllBtn');

  // Contadores de estado del editor
  const cursorPositionEl = document.getElementById('cursorPosition');
  const charCountEl = document.getElementById('charCount');
  const lineCountEl = document.getElementById('lineCount');
  const currentLangBadge = document.getElementById('currentLangBadge');

  // Sección de resultados
  const resultsSection = document.getElementById('resultsSection');
  const resultsPlaceholder = document.getElementById('resultsPlaceholder');
  const statusBanner = document.getElementById('statusBanner');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');

  // Métricas
  const analyzedLangEl = document.getElementById('analyzedLang');
  const countLexicalErrorsEl = document.getElementById('countLexicalErrors');
  const countSyntacticErrorsEl = document.getElementById('countSyntacticErrors');
  const countSemanticErrorsEl = document.getElementById('countSemanticErrors');
  const totalErrorsEl = document.getElementById('totalErrors');

  // Desglose por categorías de tokens
  const countKeywordsEl = document.getElementById('countKeywords');
  const countIdentifiersEl = document.getElementById('countIdentifiers');
  const countOperatorsEl = document.getElementById('countOperators');
  const countLiteralsEl = document.getElementById('countLiterals');
  const countDelimitersEl = document.getElementById('countDelimiters');

  // Pestañas de resultados
  const tabSummaryBtn = document.getElementById('tabSummaryBtn');
  const tabErrorsBtn = document.getElementById('tabErrorsBtn');
  const tabTokensBtn = document.getElementById('tabTokensBtn');
  const tabStatsBtn = document.getElementById('tabStatsBtn');
  const tabSummaryPane = document.getElementById('tabSummaryPane');
  const tabErrorsPane = document.getElementById('tabErrorsPane');
  const tabTokensPane = document.getElementById('tabTokensPane');
  const tabStatsPane = document.getElementById('tabStatsPane');
  const errorCountBadge = document.getElementById('errorCountBadge');
  const tokenCountBadge = document.getElementById('tokenCountBadge');
  const executionTimeEl = document.getElementById('executionTime');

  // Navegación de la barra lateral e historial
  const navHome = document.getElementById('navHome');
  const navEditor = document.getElementById('navEditor');
  const navHistory = document.getElementById('navHistory');
  const navInfo = document.getElementById('navInfo');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyBackdrop = document.getElementById('historyBackdrop');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const historyList = document.getElementById('historyList');
  const historyCounterBadge = document.getElementById('historyCounterBadge');
  const sessionHistory = [];

  // Filtros de errores por nivel
  const filterPillAll = document.getElementById('filterPillAll');
  const filterPillLexical = document.getElementById('filterPillLexical');
  const filterPillSyntactic = document.getElementById('filterPillSyntactic');
  const filterPillSemantic = document.getElementById('filterPillSemantic');
  const pillCountAll = document.getElementById('pillCountAll');
  const pillCountLexical = document.getElementById('pillCountLexical');
  const pillCountSyntactic = document.getElementById('pillCountSyntactic');
  const pillCountSemantic = document.getElementById('pillCountSemantic');

  // Contenedores de contenido
  const errorsContainer = document.getElementById('errorsContainer');
  const tokensTableBody = document.getElementById('tokensTableBody');
  const tokenSearchInput = document.getElementById('tokenSearchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');

  // Estado interno del análisis
  let currentAnalysis = {
    language: 'Python',
    tokens: [],
    lexicalErrors: [],
    syntacticErrors: [],
    semanticErrors: [],
    allErrors: [],
    counts: { lexical: 0, syntactic: 0, semantic: 0, total: 0 },
    executionTime: 0
  };

  let activeErrorFilter = 'all'; // 'all' | 'lexical' | 'syntactic' | 'semantic'

  /**
   * Inicialización
   */
  function init() {
    setupEventListeners();
    updateLineNumbers();
    updateEditorStats();
    // Cargar ejemplo inicial combinado de Python
    loadSampleCode('python', 'allErrors');
  }

  /**
   * Configuración de eventos
   */
  function setupEventListeners() {
    // Sincronización del editor de código
    codeEditor.addEventListener('input', () => {
      updateLineNumbers();
      updateEditorStats();
    });

    codeEditor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    codeEditor.addEventListener('click', updateEditorStats);
    codeEditor.addEventListener('keyup', (e) => {
      updateEditorStats();
      // Atajo de teclado: Ctrl + Enter o Cmd + Enter para analizar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        runMultiLevelAnalysis();
      }
    });

    // Soporte para tabulación en el editor (4 espacios)
    codeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const tabSpaces = '    ';
        codeEditor.value = codeEditor.value.substring(0, start) + tabSpaces + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + tabSpaces.length;
        updateLineNumbers();
        updateEditorStats();
      }
    });

    // Cambio de lenguaje
    languageSelect.addEventListener('change', () => {
      const lang = languageSelect.value;
      updateLanguageBadge(lang);
      loadSampleCode(lang, 'allErrors');
    });

    // Botones de acción principales
    analyzeBtn.addEventListener('click', runMultiLevelAnalysis);
    clearBtn.addEventListener('click', clearEditor);
    copyBtn.addEventListener('click', copyCodeToClipboard);

    // Botones de presets
    if (loadValidBtn) loadValidBtn.addEventListener('click', () => loadSampleCode(languageSelect.value, 'valid'));
    if (loadLexicalBtn) loadLexicalBtn.addEventListener('click', () => loadSampleCode(languageSelect.value, 'lexicalErrors'));
    if (loadSyntacticBtn) loadSyntacticBtn.addEventListener('click', () => loadSampleCode(languageSelect.value, 'syntacticErrors'));
    if (loadSemanticBtn) loadSemanticBtn.addEventListener('click', () => loadSampleCode(languageSelect.value, 'semanticErrors'));
    if (loadAllBtn) loadAllBtn.addEventListener('click', () => loadSampleCode(languageSelect.value, 'allErrors'));

    // Filtros de nivel de error
    const filterPills = [filterPillAll, filterPillLexical, filterPillSyntactic, filterPillSemantic];
    filterPills.forEach(pill => {
      if (pill) {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => p && p.classList.remove('active'));
          pill.classList.add('active');
          activeErrorFilter = pill.getAttribute('data-filter') || 'all';
          renderErrorsReport();
        });
      }
    });

    // Pestañas de resultados
    if (tabSummaryBtn) tabSummaryBtn.addEventListener('click', () => switchTab('summary'));
    tabErrorsBtn.addEventListener('click', () => switchTab('errors'));
    tabTokensBtn.addEventListener('click', () => switchTab('tokens'));
    tabStatsBtn.addEventListener('click', () => switchTab('stats'));

    // Navegación en la barra lateral
    if (navHome) {
      navHome.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (navEditor) {
      navEditor.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = document.getElementById('codeEditorSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (navInfo) {
      navInfo.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = document.getElementById('infoSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Historial lateral (Drawer)
    if (navHistory) {
      navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        openHistoryDrawer();
      });
    }
    if (btnCloseHistory) btnCloseHistory.addEventListener('click', closeHistoryDrawer);
    if (historyBackdrop) historyBackdrop.addEventListener('click', closeHistoryDrawer);

    // Filtros de la tabla de tokens
    tokenSearchInput.addEventListener('input', renderTokensTable);
    categoryFilter.addEventListener('change', renderTokensTable);

    // Exportación
    exportCsvBtn.addEventListener('click', exportErrorsAndTokensToCSV);
    exportJsonBtn.addEventListener('click', exportAnalysisToJSON);

    // Accordions del panel informativo
    setupInfoPanel();
  }

  /**
   * Actualiza el badge del lenguaje seleccionado
   */
  function updateLanguageBadge(langKey) {
    const names = {
      python: 'Python 3',
      javascript: 'JavaScript (ES2024)',
      cpp: 'C++ (C++20)'
    };
    currentLangBadge.textContent = names[langKey] || langKey;
  }

  /**
   * Actualiza los números de línea y marcadores de error en el gutter
   */
  function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    const totalLines = Math.max(lines.length, 1);

    // Mapa de errores por línea
    const errorsPerLine = new Map();
    if (currentAnalysis.allErrors && currentAnalysis.allErrors.length > 0) {
      currentAnalysis.allErrors.forEach(err => {
        if (!errorsPerLine.has(err.line)) {
          errorsPerLine.set(err.line, new Set());
        }
        errorsPerLine.get(err.line).add(err.category);
      });
    }

    let html = '';
    for (let i = 1; i <= totalLines; i++) {
      let dotsHtml = '';
      if (errorsPerLine.has(i)) {
        const cats = errorsPerLine.get(i);
        dotsHtml = '<span class="line-dots">';
        if (cats.has('lexical')) dotsHtml += '<span class="gutter-dot dot-lexical" title="Error Léxico en línea ' + i + '"></span>';
        if (cats.has('syntactic')) dotsHtml += '<span class="gutter-dot dot-syntactic" title="Error Sintáctico en línea ' + i + '"></span>';
        if (cats.has('semantic')) dotsHtml += '<span class="gutter-dot dot-semantic" title="Error Semántico en línea ' + i + '"></span>';
        dotsHtml += '</span>';
      }

      html += `
        <div class="line-row" data-line="${i}">
          <span class="line-num">${i}</span>
          ${dotsHtml}
        </div>
      `;
    }
    lineNumbers.innerHTML = html;
  }

  /**
   * Actualiza las estadísticas de posición del cursor y longitud
   */
  function updateEditorStats() {
    const text = codeEditor.value;
    const lines = text.split('\n');
    lineCountEl.textContent = lines.length;
    charCountEl.textContent = text.length;

    const cursorPos = codeEditor.selectionStart;
    let currentLine = 1;
    let currentCol = 1;

    for (let i = 0; i < cursorPos; i++) {
      if (text[i] === '\n') {
        currentLine++;
        currentCol = 1;
      } else {
        currentCol++;
      }
    }
    cursorPositionEl.textContent = `Lín: ${currentLine}, Col: ${currentCol}`;
  }

  /**
   * Carga un código de ejemplo predefinido
   */
  function loadSampleCode(lang, type) {
    if (window.SAMPLE_CODES && window.SAMPLE_CODES[lang]) {
      const code = window.SAMPLE_CODES[lang][type] || window.SAMPLE_CODES[lang].valid || '';
      codeEditor.value = code;
      updateLineNumbers();
      updateEditorStats();
      runMultiLevelAnalysis();
    }
  }

  /**
   * Limpia el editor y restablece la vista
   */
  function clearEditor() {
    codeEditor.value = '';
    currentAnalysis = {
      language: '',
      tokens: [],
      lexicalErrors: [],
      syntacticErrors: [],
      semanticErrors: [],
      allErrors: [],
      counts: { lexical: 0, syntactic: 0, semantic: 0, total: 0 },
      executionTime: 0
    };
    updateLineNumbers();
    updateEditorStats();
    resetResultsView();
    codeEditor.focus();
  }

  /**
   * Copia el código al portapapeles
   */
  function copyCodeToClipboard() {
    if (!codeEditor.value) return;
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg> Copiado
      `;
      copyBtn.classList.add('btn-success');
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('btn-success');
      }, 2000);
    });
  }

  /**
   * Ejecuta el análisis en sus tres niveles: Léxico, Sintáctico y Semántico
   */
  function runMultiLevelAnalysis() {
    const sourceCode = codeEditor.value;
    const lang = languageSelect.value;

    if (sourceCode.trim().length === 0) {
      showToast('Por favor introduzca algún fragmento de código para analizar.', 'warning');
      return;
    }

    const startTime = performance.now();
    let analysisResult;

    try {
      switch (lang) {
        case 'python':
          analysisResult = new window.PythonAnalyzer(sourceCode).analyze();
          break;
        case 'javascript':
          analysisResult = new window.JavaScriptAnalyzer(sourceCode).analyze();
          break;
        case 'cpp':
          analysisResult = new window.CppAnalyzer(sourceCode).analyze();
          break;
        default:
          throw new Error('Lenguaje no soportado: ' + lang);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      currentAnalysis = {
        ...analysisResult,
        executionTime: duration
      };

      displayResults(currentAnalysis);
      updateLineNumbers(); // Actualizar indicadores en el gutter
    } catch (err) {
      console.error('Error durante el análisis:', err);
      showToast('Ocurrió un error inesperado durante el análisis: ' + err.message, 'error');
    }
  }

  /**
   * Muestra los resultados en la interfaz
   */
  function displayResults(data) {
    resultsPlaceholder.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    const { lexical, syntactic, semantic, total } = data.counts;
    const hasErrors = total > 0;

    // Actualizar métricas del resumen
    analyzedLangEl.textContent = data.language;
    countLexicalErrorsEl.textContent = lexical;
    countSyntacticErrorsEl.textContent = syntactic;
    countSemanticErrorsEl.textContent = semantic;
    totalErrorsEl.textContent = total;

    // Actualizar contadores de las píldoras de filtro
    pillCountAll.textContent = total;
    pillCountLexical.textContent = lexical;
    pillCountSyntactic.textContent = syntactic;
    pillCountSemantic.textContent = semantic;

    // Badges en las pestañas
    errorCountBadge.textContent = total;
    tokenCountBadge.textContent = data.tokens.length;

    if (hasErrors) {
      errorCountBadge.className = 'tab-badge badge-error';
    } else {
      errorCountBadge.className = 'tab-badge badge-neutral';
    }

    // Banner de estado general
    if (hasErrors) {
      statusBanner.className = 'status-banner status-banner-error';
      statusIcon.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
      statusTitle.textContent = `Se encontraron ${total} error(es) en el código`;
      statusDesc.textContent = `Desglose: ${lexical} error(es) léxico(s), ${syntactic} sintáctico(s) y ${semantic} semántico(s). Revise el reporte clasificado a continuación para ver sugerencias y ubicaciones.`;
      switchTab('errors');
    } else {
      statusBanner.className = 'status-banner status-banner-success';
      statusIcon.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
      statusTitle.textContent = '¡Análisis correcto en todos los niveles!';
      statusDesc.textContent = `No se detectaron errores léxicos, sintácticos ni semánticos. El código cumple con las reglas formales de ${data.language} (${data.tokens.length} tokens clasificados).`;
      switchTab('tokens');
    }

    // Desglose de categorías de tokens
    updateCategoryStats(data.tokens);

    // Actualizar tiempo de ejecución en la tarjeta de resumen
    if (executionTimeEl) {
      executionTimeEl.textContent = `${data.executionTime} ms`;
    }

    // Registrar en el historial de sesión
    recordHistoryEntry(data, codeEditor.value);

    // Renderizar reporte de errores
    renderErrorsReport();

    // Renderizar tabla de tokens
    renderTokensTable();
  }

  /**
   * Calcula y actualiza el desglose por categorías de tokens
   */
  function updateCategoryStats(tokens) {
    let kw = 0, id = 0, op = 0, lit = 0, del = 0;

    tokens.forEach(t => {
      switch (t.category) {
        case 'keyword': kw++; break;
        case 'identifier': id++; break;
        case 'operator': op++; break;
        case 'literal': lit++; break;
        case 'delimiter':
        case 'preprocessor':
        case 'comment': del++; break;
      }
    });

    countKeywordsEl.textContent = kw;
    countIdentifiersEl.textContent = id;
    countOperatorsEl.textContent = op;
    countLiteralsEl.textContent = lit;
    countDelimitersEl.textContent = del;
  }

  /**
   * Renderiza el reporte de errores filtrado por nivel
   */
  function renderErrorsReport() {
    let list = currentAnalysis.allErrors || [];

    if (activeErrorFilter !== 'all') {
      list = list.filter(e => e.category === activeErrorFilter);
    }

    if (list.length === 0) {
      if (currentAnalysis.counts.total === 0) {
        errorsContainer.innerHTML = `
          <div class="empty-state success-empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>¡Sin errores detectados!</h3>
            <p>El código no contiene errores léxicos, sintácticos ni semánticos según las reglas y gramática de <strong>${currentAnalysis.language}</strong>.</p>
          </div>
        `;
      } else {
        errorsContainer.innerHTML = `
          <div class="empty-state">
            <p>No hay errores en la categoría seleccionada (<strong>${activeErrorFilter}</strong>).</p>
          </div>
        `;
      }
      return;
    }

    let html = `
      <div class="errors-list-header">
        Mostrando <strong>${list.length}</strong> problema(s) encontrados:
      </div>
      <div class="errors-grid">
    `;

    list.forEach((err) => {
      const cardClass = `error-card-${err.category}`;
      const badgeClass = `level-${err.category}`;
      const escapedLexeme = escapeHtml(err.lexeme);
      const escapedDesc = escapeHtml(err.description);
      const escapedSuggestion = escapeHtml(err.suggestion);

      html += `
        <div class="error-card ${cardClass}" data-line="${err.line}" data-col="${err.column}">
          <div class="error-card-header">
            <div class="error-badge-group">
              <span class="level-badge ${badgeClass}">${err.level}</span>
              <span class="error-type-tag">${escapeHtml(err.errorType)}</span>
            </div>
            <div class="error-location-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Línea ${err.line}, Columna ${err.column}
            </div>
          </div>

          <div class="error-card-body">
            <div class="error-field">
              <span class="field-label">Fragmento involucrado:</span>
              <code class="error-lexeme">${escapedLexeme || '(espacio o salto)'}</code>
            </div>
            <div class="error-field">
              <span class="field-label">Descripción del problema:</span>
              <span class="field-value">${escapedDesc}</span>
            </div>
            ${err.suggestion ? `
              <div class="error-suggestion">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span><strong>Sugerencia:</strong> ${escapedSuggestion}</span>
              </div>
            ` : ''}
          </div>

          <div class="error-card-footer">
            <button type="button" class="btn-locate-error" onclick="window.locateErrorInEditor(${err.line}, ${err.column}, '${err.category}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Ubicar en el editor (Lín ${err.line})
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    errorsContainer.innerHTML = html;
  }

  /**
   * Renderiza la tabla de tokens
   */
  function renderTokensTable() {
    const tokens = currentAnalysis.tokens || [];
    const searchTerm = (tokenSearchInput.value || '').toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    let filtered = tokens.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchTerm) {
        return t.lexeme.toLowerCase().includes(searchTerm) || t.type.toLowerCase().includes(searchTerm);
      }
      return true;
    });

    if (filtered.length === 0) {
      tokensTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">
            No se encontraron tokens que coincidan con los filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.forEach(t => {
      const badgeClass = getBadgeClassForCategory(t.category);
      html += `
        <tr>
          <td class="token-id">#${t.id}</td>
          <td class="token-lexeme"><code class="code-token ${badgeClass}">${escapeHtml(t.lexeme)}</code></td>
          <td class="token-type"><span class="token-badge ${badgeClass}">${escapeHtml(t.type)}</span></td>
          <td class="token-line">${t.line}</td>
          <td class="token-col">${t.column}</td>
        </tr>
      `;
    });

    tokensTableBody.innerHTML = html;
  }

  function getBadgeClassForCategory(category) {
    switch (category) {
      case 'keyword': return 'cat-keyword';
      case 'identifier': return 'cat-identifier';
      case 'operator': return 'cat-operator';
      case 'literal': return 'cat-literal';
      case 'delimiter': return 'cat-delimiter';
      case 'comment': return 'cat-comment';
      case 'preprocessor': return 'cat-preprocessor';
      default: return 'cat-default';
    }
  }

  /**
   * Control del historial de sesión y drawer
   */
  function openHistoryDrawer() {
    if (historyDrawer) historyDrawer.classList.add('open');
    if (historyBackdrop) historyBackdrop.classList.add('active');
  }

  function closeHistoryDrawer() {
    if (historyDrawer) historyDrawer.classList.remove('open');
    if (historyBackdrop) historyBackdrop.classList.remove('active');
  }

  function recordHistoryEntry(analysisData, codeSnippet) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = {
      id: Date.now(),
      lang: languageSelect.value,
      langName: analysisData.language,
      code: codeSnippet,
      totalErrors: analysisData.counts.total,
      counts: { ...analysisData.counts },
      timeStr: timeStr,
      executionTime: analysisData.executionTime
    };
    sessionHistory.unshift(entry);
    updateHistoryUI();
  }

  function updateHistoryUI() {
    if (historyCounterBadge) historyCounterBadge.textContent = sessionHistory.length;
    if (!historyList) return;

    if (sessionHistory.length === 0) {
      historyList.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 1rem;">
          No hay análisis previos registrados en esta sesión.
        </p>
      `;
      return;
    }

    let html = '';
    sessionHistory.forEach((item, index) => {
      const isClean = item.totalErrors === 0;
      const statusBadge = isClean 
        ? '<span style="color: var(--color-success); font-weight:700;">✓ Válido (0 errores)</span>'
        : `<span style="color: var(--color-lexical); font-weight:700;">${item.totalErrors} error(es)</span>`;
      const preview = escapeHtml(item.code.slice(0, 70).replace(/\n/g, ' '));

      html += `
        <div class="history-item-card" data-history-idx="${index}">
          <div class="history-item-meta">
            <span class="history-item-lang">${escapeHtml(item.langName)}</span>
            <span>${item.timeStr}</span>
          </div>
          <div style="font-family: var(--font-code); font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${preview}...
          </div>
          <div class="history-item-counts">
            ${statusBadge}
            <span style="color: var(--text-muted); font-weight: normal; margin-left: auto;">${item.executionTime} ms</span>
          </div>
        </div>
      `;
    });
    historyList.innerHTML = html;

    const cards = historyList.querySelectorAll('.history-item-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-history-idx'), 10);
        const item = sessionHistory[idx];
        if (item) {
          languageSelect.value = item.lang;
          updateLanguageBadge(item.lang);
          codeEditor.value = item.code;
          updateLineNumbers();
          updateEditorStats();
          closeHistoryDrawer();
          runMultiLevelAnalysis();
          showToast(`Código de historial (${item.langName}) restaurado.`, 'info');
        }
      });
    });
  }

  function switchTab(tabName) {
    if (tabSummaryBtn) tabSummaryBtn.classList.remove('active');
    tabErrorsBtn.classList.remove('active');
    tabTokensBtn.classList.remove('active');
    tabStatsBtn.classList.remove('active');

    if (tabSummaryPane) tabSummaryPane.classList.add('hidden');
    tabErrorsPane.classList.add('hidden');
    tabTokensPane.classList.add('hidden');
    tabStatsPane.classList.add('hidden');

    if (tabName === 'summary' && tabSummaryBtn && tabSummaryPane) {
      tabSummaryBtn.classList.add('active');
      tabSummaryPane.classList.remove('hidden');
    } else if (tabName === 'errors') {
      tabErrorsBtn.classList.add('active');
      tabErrorsPane.classList.remove('hidden');
    } else if (tabName === 'tokens') {
      tabTokensBtn.classList.add('active');
      tabTokensPane.classList.remove('hidden');
    } else if (tabName === 'stats') {
      tabStatsBtn.classList.add('active');
      tabStatsPane.classList.remove('hidden');
    }
  }

  function resetResultsView() {
    resultsPlaceholder.classList.remove('hidden');
    resultsSection.classList.add('hidden');
  }

  /**
   * Navega y resalta una línea en el editor de código con animación del color correspondiente
   */
  window.locateErrorInEditor = function(targetLine, targetCol, category = 'lexical') {
    codeEditor.focus();
    const lines = codeEditor.value.split('\n');

    let charIndex = 0;
    for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    charIndex += Math.max(0, targetCol - 1);

    codeEditor.setSelectionRange(charIndex, charIndex + 1);

    const lineHeight = 22.4;
    codeEditor.scrollTop = Math.max(0, (targetLine - 3) * lineHeight);
    lineNumbers.scrollTop = codeEditor.scrollTop;

    // Animación visual de resalte según el nivel
    editorContainer.classList.remove('flash-lexical', 'flash-syntactic', 'flash-semantic');
    void editorContainer.offsetWidth; // Forzar reflujo para reiniciar animación
    editorContainer.classList.add(`flash-${category}`);

    const categoryNames = {
      lexical: 'Léxico (Rojo)',
      syntactic: 'Sintáctico (Naranja)',
      semantic: 'Semántico (Amarillo)'
    };
    showToast(`Posicionado en Error ${categoryNames[category] || ''} (Lín: ${targetLine}, Col: ${targetCol})`, category === 'lexical' ? 'error' : 'warning');
  };

  /**
   * Exporta tokens y errores a CSV
   */
  function exportErrorsAndTokensToCSV() {
    let csvContent = 'Categoria_Analisis,ID_o_Tipo,Elemento,Descripcion_o_Tipo,Linea,Columna\n';

    // Errores
    currentAnalysis.allErrors.forEach(e => {
      const cleanDesc = '"' + e.description.replace(/"/g, '""') + '"';
      const cleanLexeme = '"' + (e.lexeme || '').replace(/"/g, '""') + '"';
      csvContent += `ERROR_${e.level.toUpperCase()},"${e.errorType}",${cleanLexeme},${cleanDesc},${e.line},${e.column}\n`;
    });

    // Tokens
    currentAnalysis.tokens.forEach(t => {
      const cleanLexeme = '"' + t.lexeme.replace(/"/g, '""') + '"';
      const cleanType = '"' + t.type.replace(/"/g, '""') + '"';
      csvContent += `TOKEN,${t.id},${cleanLexeme},${cleanType},${t.line},${t.column}\n`;
    });

    downloadFile(csvContent, `analisis_completo_${currentAnalysis.language.toLowerCase()}.csv`, 'text/csv;charset=utf-8;');
    showToast('Reporte CSV descargado con éxito.', 'success');
  }

  /**
   * Exporta el análisis completo a JSON
   */
  function exportAnalysisToJSON() {
    const exportData = {
      asignatura: 'Autómatas I / Compiladores',
      herramienta: 'Analizador de Errores Multinivel',
      fecha: new Date().toISOString(),
      lenguaje: currentAnalysis.language,
      metricas: currentAnalysis.counts,
      tiempoEjecucionMs: currentAnalysis.executionTime,
      resumenValido: currentAnalysis.counts.total === 0,
      erroresLexicos: currentAnalysis.lexicalErrors,
      erroresSintacticos: currentAnalysis.syntacticErrors,
      erroresSemanticos: currentAnalysis.semanticErrors,
      tokens: currentAnalysis.tokens
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(jsonString, `analisis_multinivel_${currentAnalysis.language.toLowerCase()}.json`, 'application/json');
    showToast('Reporte JSON descargado con éxito.', 'success');
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupInfoPanel() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('open');
      });
    });
  }

  function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3500);
  }

  init();
});
