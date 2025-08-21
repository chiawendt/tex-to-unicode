var TexToUnicode;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const symbols = __webpack_require__(1);
const {findNodesBetweenNodes} = __webpack_require__(2);
const parser = __webpack_require__(3);

/**
 * @typedef {{subscripts?: boolean}} Options
 */

/**
 * Check if two interval overlaps.
 *
 * @param {[number, number]} i
 * @param {[number, number]} j
 * @returns {boolean}
 */
function overlaps([a, b], [c, d]) {
  return (
    (c <= a && a < d) ||
    (c <= b - 1 && b - 1 < d) ||
    (a <= c && c < b) ||
    (a <= d - 1 && d - 1 < b)
  );
}

/** @param {string} s */
function debrackets(s) {
  s = s.trim();
  if (s[0] === '{' && s[s.length - 1] === '}') {
    return debrackets(s.slice(1, s.length - 1));
  }
  return s;
}

/**
 * @param {string} source
 * @param {any} node
 * @returns {string}
 */
function printSource(source, node) {
  return source.slice(node.start, node.end);
}

/**
 * @param {string} source
 * @param {any} node
 * @param {Options} options
 * @returns {string}
 */
function printNode(source, node, options = {}) {
  switch (node.type) {
    case 'PlainText':
    case 'CurlyGroup': {
      return printSource(source, node);
    }
    case 'UnaryMacro': {
      const arugmentText = printSource(source, node.argument);

      const key =
        node.macro === '\\not'
          ? `${node.macro}${debrackets(arugmentText)}`
          : `${node.macro}{${debrackets(arugmentText)}}`;

      return symbols[key] || printSource(source, node);
    }
    case 'NullaryMacro': {
      return symbols[node.macro] || printSource(source, node);
    }
    case 'Subscript':
    case 'Superscript': {
      if (!options.subscripts) {
        return printSource(source, node);
      }

      let r = '';
      for (const c of debrackets(node.content)) {
        const h = node.type === 'Subscript' ? '_' : '^';
        const v = symbols[`${h}${c}`];
        if (v === undefined) {
          return printSource(source, node);
        }
        r += v;
      }
      return r;
    }
  }

  console.error(node);
  throw new Error('unhandled case');
}

function print(source, ast, selectStart, selectEnd, options = {}) {
  const nodes = ast.body;
  let cursor = -1;
  let output = '';
  for (const node of nodes) {
    if (overlaps([selectStart, selectEnd], [node.start, node.end])) {
      output += printNode(source, node, options);
    } else {
      output += source.slice(node.start, node.end);
    }

    if (node.start < selectEnd && selectEnd <= node.end) {
      cursor =
        node.type !== 'PlainText'
          ? output.length
          : output.length - (node.end - selectEnd);
    }
  }

  return {
    text: output,
    cursor,
  };
}

/**
 * @param {string} text
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {Options} options
 * @returns {{
 *  text: string,
 *  cursor: number,
 * }}
 */
function convertText(text, selectStart, selectEnd, options = {}) {
  selectEnd = Math.min(selectEnd, text.length);
  // The parser is not supposed to throw error by design.
  const ast = parser.tryParse(text);
  return print(text, ast, selectStart, selectEnd, options);
}

/**
 * Convert TeX in textarea or "contentEditable", and then set cursor.
 *
 * @param {HTMLElement} element
 * @param {Options} options
 * @returns {void}
 */
function convertInputable(element, options) {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const /** @type {any} */ textarea = element;
    const {selectionStart, selectionEnd} = textarea;
    const {text, cursor} = convertText(
      textarea.value,
      selectionStart,
      selectionEnd,
      options
    );
    textarea.select();
    element.ownerDocument.execCommand('insertText', false, text);
    textarea.selectStart = textarea.selectionEnd = cursor;
  }
  // contenteditable elements: ex. Gmail message body.
  else if (element.contentEditable) {
    const selection = element.ownerDocument.getSelection();
    if (!selection) {
      return;
    }
    const nodesBetweenNodes = findNodesBetweenNodes(
      selection.anchorNode,
      selection.focusNode
    );

    const [startNode] = nodesBetweenNodes;
    const endNode = nodesBetweenNodes[nodesBetweenNodes.length - 1];

    const selectionIsForward =
      startNode === selection.anchorNode &&
      selection.anchorOffset <= selection.focusOffset;

    const [startCursor, endCursor] = selectionIsForward
      ? [selection.anchorOffset, selection.focusOffset]
      : [selection.focusOffset, selection.anchorOffset];

    const TEXT_NODE_TYPE = 3;
    let _cursor;
    for (const node of nodesBetweenNodes) {
      if (node.nodeType === TEXT_NODE_TYPE) {
        const selectionStart = node === nodesBetweenNodes[0] ? startCursor : 0;
        const selectionEnd =
          node === nodesBetweenNodes[nodesBetweenNodes.length - 1]
            ? endCursor
            : node.nodeValue.length;
        const {text, cursor} = convertText(
          node.nodeValue,
          selectionStart,
          selectionEnd,
          options
        );
        node.nodeValue = text;
        _cursor = cursor;
      }
    }

    selection.collapse(endNode, _cursor);
  }
}

module.exports = {
  parser,
  symbols,
  convertText,
  convertInputable,
};


/***/ }),
/* 1 */
/***/ ((module) => {

const symbols = {
  '\\Alpha': 'Α',
  '\\Beta': 'Β',
  '\\Gamma': 'Γ',
  '\\Delta': 'Δ',
  '\\Epsilon': 'Ε',
  '\\Zeta': 'Ζ',
  '\\Eta': 'Η',
  '\\Theta': 'Θ',
  '\\Iota': 'I',
  '\\Kappa': 'Κ',
  '\\Lambda': 'Λ',
  '\\Mu': 'Μ',
  '\\Nu': 'Ν',
  '\\Xi': 'Ξ',
  '\\Omicron': 'Ο',
  '\\Pi': 'Π',
  '\\Rho': 'Ρ',
  '\\Sigma': 'Σ',
  '\\Tau': 'Τ',
  '\\Upsilon': 'Υ',
  '\\Phi': 'Φ',
  '\\Chi': 'Χ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',

  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ϵ',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\omicron': 'ο',
  '\\pi': 'π',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'ϕ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',

  '\\varepsilon': 'ε',
  '\\varnothing': '∅',
  '\\varkappa': 'ϰ',
  '\\varphi': 'φ',
  '\\varpi': 'ϖ',
  '\\varrho': 'ϱ',
  '\\varsigma': 'ς',
  '\\vartheta': 'ϑ',
  '\\neq': '≠',
  '\\equiv': '≡',
  '\\not\\equiv': '≢',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\leqq': '≦',
  '\\geqq': '≧',
  '\\lneqq': '≨',
  '\\gneqq': '≩',
  '\\leqslant': '⩽',
  '\\geqslant': '⩾',
  '\\ll': '≪',
  '\\gg': '≫',
  '\\nless': '≮',
  '\\ngtr': '≯',
  '\\nleq': '≰',
  '\\ngeq': '≱',
  '\\lessequivlnt': '≲',
  '\\greaterequivlnt': '≳',
  '\\prec': '≺',
  '\\succ': '≻',
  '\\preccurlyeq': '≼',
  '\\succcurlyeq': '≽',
  '\\precapprox': '≾',
  '\\succapprox': '≿',
  '\\nprec': '⊀',
  '\\nsucc': '⊁',
  '\\sim': '∼',
  '\\not\\sim': '≁',
  '\\simeq': '≃',
  '\\not\\simeq': '≄',
  '\\backsim': '∽',
  '\\lazysinv': '∾',
  '\\wr': '≀',
  '\\cong': '≅',
  '\\not\\cong': '≇',
  '\\approx': '≈',
  '\\not\\approx': '≉',
  '\\approxeq': '≊',
  '\\approxnotequal': '≆',
  '\\tildetrpl': '≋',
  '\\allequal': '≌',
  '\\asymp': '≍',
  '\\doteq': '≐',
  '\\doteqdot': '≑',
  '\\lneq': '⪇',
  '\\gneq': '⪈',
  '\\preceq': '⪯',
  '\\succeq': '⪰',
  '\\precneqq': '⪵',
  '\\succneqq': '⪶',
  '\\emptyset': '∅',
  '\\in': '∈',
  '\\notin': '∉',
  '\\not\\in': '∉',
  '\\ni': '∋',
  '\\not\\ni': '∌',
  '\\subset': '⊂',
  '\\subseteq': '⊆',
  '\\not\\subset': '⊄',
  '\\not\\subseteq': '⊈',
  '\\supset': '⊃',
  '\\supseteq': '⊇',
  '\\not\\supset': '⊅',
  '\\not\\supseteq': '⊉',
  '\\subsetneq': '⊊',
  '\\supsetneq': '⊋',
  '\\exists': '∃',
  '\\nexists': '∄',
  '\\not\\exists': '∄',
  '\\forall': '∀',
  '\\aleph': 'ℵ',
  '\\beth': 'ℶ',
  '\\neg': '¬',
  '\\wedge': '∧',
  '\\vee': '∨',
  '\\veebar': '⊻',
  '\\land': '∧',
  '\\lor': '∨',
  '\\top': '⊤',
  '\\bot': '⊥',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\bigcup': '⋃',
  '\\bigcap': '⋂',
  '\\setminus': '∖',
  '\\therefore': '∴',
  '\\because': '∵',
  '\\Box': '□',
  '\\models': '⊨',
  '\\vdash': '⊢',

  '\\rightarrow': '→',
  '\\Rightarrow': '⇒',
  '\\leftarrow': '←',
  '\\Leftarrow': '⇐',
  '\\uparrow': '↑',
  '\\Uparrow': '⇑',
  '\\downarrow': '↓',
  '\\Downarrow': '⇓',
  '\\nwarrow': '↖',
  '\\nearrow': '↗',
  '\\searrow': '↘',
  '\\swarrow': '↙',
  '\\mapsto': '↦',
  '\\to': '→',
  '\\leftrightarrow': '↔',
  '\\hookleftarrow': '↩',
  '\\Leftrightarrow': '⇔',
  '\\rightarrowtail': '↣',
  '\\leftarrowtail': '↢',
  '\\twoheadrightarrow': '↠',
  '\\twoheadleftarrow': '↞',
  '\\hookrightarrow': '↪',
  '\\rightsquigarrow': '⇝',
  '\\rightleftharpoons': '⇌',
  '\\leftrightharpoons': '⇋',
  '\\rightharpoonup': '⇀',
  '\\rightharpoondown': '⇁',

  '\\times': '×',
  '\\div': '÷',
  '\\infty': '∞',
  '\\nabla': '∇',
  '\\partial': '∂',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\coprod': '∐',
  '\\int': '∫',
  '\\iint': '∬',
  '\\iiint': '∭',
  '\\iiiint': '⨌',
  '\\oint': '∮',
  '\\surfintegral': '∯',
  '\\volintegral': '∰',
  '\\Re': 'ℜ',
  '\\Im': 'ℑ',
  '\\wp': '℘',
  '\\mp': '∓',
  '\\langle': '⟨',
  '\\rangle': '⟩',
  '\\lfloor': '⌊',
  '\\rfloor': '⌋',
  '\\lceil': '⌈',
  '\\rceil': '⌉',
  '\\|': '‖',

  '\\mathbb{a}': '𝕒',
  '\\mathbb{A}': '𝔸',
  '\\mathbb{b}': '𝕓',
  '\\mathbb{B}': '𝔹',
  '\\mathbb{c}': '𝕔',
  '\\mathbb{C}': 'ℂ',
  '\\mathbb{d}': '𝕕',
  '\\mathbb{D}': '𝔻',
  '\\mathbb{e}': '𝕖',
  '\\mathbb{E}': '𝔼',
  '\\mathbb{f}': '𝕗',
  '\\mathbb{F}': '𝔽',
  '\\mathbb{g}': '𝕘',
  '\\mathbb{G}': '𝔾',
  '\\mathbb{h}': '𝕙',
  '\\mathbb{H}': 'ℍ',
  '\\mathbb{i}': '𝕚',
  '\\mathbb{I}': '𝕀',
  '\\mathbb{j}': '𝕛',
  '\\mathbb{J}': '𝕁',
  '\\mathbb{k}': '𝕜',
  '\\mathbb{K}': '𝕂',
  '\\mathbb{l}': '𝕝',
  '\\mathbb{L}': '𝕃',
  '\\mathbb{m}': '𝕞',
  '\\mathbb{M}': '𝕄',
  '\\mathbb{n}': '𝕟',
  '\\mathbb{N}': 'ℕ',
  '\\mathbb{o}': '𝕠',
  '\\mathbb{O}': '𝕆',
  '\\mathbb{p}': '𝕡',
  '\\mathbb{P}': 'ℙ',
  '\\mathbb{q}': '𝕢',
  '\\mathbb{Q}': 'ℚ',
  '\\mathbb{r}': '𝕣',
  '\\mathbb{R}': 'ℝ',
  '\\mathbb{s}': '𝕤',
  '\\mathbb{S}': '𝕊',
  '\\mathbb{t}': '𝕥',
  '\\mathbb{T}': '𝕋',
  '\\mathbb{u}': '𝕦',
  '\\mathbb{U}': '𝕌',
  '\\mathbb{v}': '𝕧',
  '\\mathbb{V}': '𝕍',
  '\\mathbb{x}': '𝕩',
  '\\mathbb{X}': '𝕏',
  '\\mathbb{y}': '𝕪',
  '\\mathbb{Y}': '𝕐',
  '\\mathbb{z}': '𝕫',
  '\\mathbb{Z}': 'ℤ',
  '\\mathbb{0}': '𝟘',
  '\\mathbb{1}': '𝟙',
  '\\mathbb{2}': '𝟚',
  '\\mathbb{3}': '𝟛',
  '\\mathbb{4}': '𝟜',
  '\\mathbb{5}': '𝟝',
  '\\mathbb{6}': '𝟞',
  '\\mathbb{7}': '𝟟',
  '\\mathbb{8}': '𝟠',
  '\\mathbb{9}': '𝟡',

  '\\mathfrak{a}': '𝔞',
  '\\mathfrak{A}': '𝔄',
  '\\mathfrak{b}': '𝔟',
  '\\mathfrak{B}': '𝔅',
  '\\mathfrak{c}': '𝔠',
  '\\mathfrak{C}': 'ℭ',
  '\\mathfrak{d}': '𝔡',
  '\\mathfrak{D}': '𝔇',
  '\\mathfrak{e}': '𝔢',
  '\\mathfrak{E}': '𝔈',
  '\\mathfrak{f}': '𝔣',
  '\\mathfrak{F}': '𝔉',
  '\\mathfrak{g}': '𝔤',
  '\\mathfrak{G}': '𝔊',
  '\\mathfrak{h}': '𝔥',
  '\\mathfrak{H}': 'ℌ',
  '\\mathfrak{i}': '𝔦',
  '\\mathfrak{I}': 'ℑ',
  '\\mathfrak{j}': '𝔧',
  '\\mathfrak{J}': '𝔍',
  '\\mathfrak{k}': '𝔨',
  '\\mathfrak{K}': '𝔎',
  '\\mathfrak{l}': '𝔩',
  '\\mathfrak{L}': '𝔏',
  '\\mathfrak{m}': '𝔪',
  '\\mathfrak{M}': '𝔐',
  '\\mathfrak{n}': '𝔫',
  '\\mathfrak{N}': '𝔑',
  '\\mathfrak{o}': '𝔬',
  '\\mathfrak{O}': '𝔒',
  '\\mathfrak{p}': '𝔭',
  '\\mathfrak{P}': '𝔓',
  '\\mathfrak{q}': '𝔮',
  '\\mathfrak{Q}': '𝔔',
  '\\mathfrak{r}': '𝔯',
  '\\mathfrak{R}': 'ℜ',
  '\\mathfrak{s}': '𝔰',
  '\\mathfrak{S}': '𝔖',
  '\\mathfrak{t}': '𝔱',
  '\\mathfrak{T}': '𝔗',
  '\\mathfrak{u}': '𝔲',
  '\\mathfrak{U}': '𝔘',
  '\\mathfrak{v}': '𝔳',
  '\\mathfrak{V}': '𝔙',
  '\\mathfrak{x}': '𝔵',
  '\\mathfrak{X}': '𝔛',
  '\\mathfrak{y}': '𝔶',
  '\\mathfrak{Y}': '𝔜',
  '\\mathfrak{z}': '𝔷',
  '\\mathfrak{Z}': 'ℨ',

  '\\mathcal{a}': '𝒶',
  '\\mathcal{A}': '𝒜',
  '\\mathcal{b}': '𝒷',
  '\\mathcal{B}': 'ℬ',
  '\\mathcal{c}': '𝒸',
  '\\mathcal{C}': '𝒞',
  '\\mathcal{d}': '𝒹',
  '\\mathcal{D}': '𝒟',
  '\\mathcal{e}': 'ℯ',
  '\\mathcal{E}': 'ℰ',
  '\\mathcal{f}': '𝒻',
  '\\mathcal{F}': 'ℱ',
  '\\mathcal{g}': 'ℊ',
  '\\mathcal{G}': '𝒢',
  '\\mathcal{h}': '𝒽',
  '\\mathcal{H}': 'ℋ',
  '\\mathcal{i}': '𝒾',
  '\\mathcal{I}': 'ℐ',
  '\\mathcal{j}': '𝒿',
  '\\mathcal{J}': '𝒥',
  '\\mathcal{k}': '𝓀',
  '\\mathcal{K}': '𝒦',
  '\\mathcal{l}': '𝓁',
  '\\mathcal{L}': 'ℒ',
  '\\mathcal{m}': '𝓂',
  '\\mathcal{M}': 'ℳ',
  '\\mathcal{n}': '𝓃',
  '\\mathcal{N}': '𝒩',
  '\\mathcal{o}': 'ℴ',
  '\\mathcal{O}': '𝒪',
  '\\mathcal{p}': '𝓅',
  '\\mathcal{P}': '𝒫',
  '\\mathcal{q}': '𝓆',
  '\\mathcal{Q}': '𝒬',
  '\\mathcal{r}': '𝓇',
  '\\mathcal{R}': 'ℛ',
  '\\mathcal{s}': '𝓈',
  '\\mathcal{S}': '𝒮',
  '\\mathcal{t}': '𝓉',
  '\\mathcal{T}': '𝒯',
  '\\mathcal{u}': '𝓊',
  '\\mathcal{U}': '𝒰',
  '\\mathcal{v}': '𝓋',
  '\\mathcal{V}': '𝒱',
  '\\mathcal{w}': '𝓌',
  '\\mathcal{W}': '𝒲',
  '\\mathcal{x}': '𝓍',
  '\\mathcal{X}': '𝒳',
  '\\mathcal{y}': '𝓎',
  '\\mathcal{Y}': '𝒴',
  '\\mathcal{z}': '𝓏',
  '\\mathcal{Z}': '𝒵',

  _0: '₀',
  _1: '₁',
  _2: '₂',
  _3: '₃',
  _4: '₄',
  _5: '₅',
  _6: '₆',
  _7: '₇',
  _8: '₈',
  _9: '₉',
  '^0': '⁰',
  '^1': '¹',
  '^2': '²',
  '^3': '³',
  '^4': '⁴',
  '^5': '⁵',
  '^6': '⁶',
  '^7': '⁷',
  '^8': '⁸',
  '^9': '⁹',

  '_+': '₊',
  '_-': '₋',
  '_(': '₍',
  '_)': '₎',
  '^+': '⁺',
  '^-': '⁻',
  '^(': '⁽',
  '^)': '⁾',

  _a: 'ₐ',
  _e: 'ₑ',
  _h: 'ₕ',
  _i: 'ᵢ',
  _j: 'ⱼ',
  _k: 'ₖ',
  _l: 'ₗ',
  _m: 'ₘ',
  _n: 'ₙ',
  _o: 'ₒ',
  _p: 'ₚ',
  _r: 'ᵣ',
  _s: 'ₛ',
  _t: 'ₜ',
  _u: 'ᵤ',
  _v: 'ᵥ',
  _x: 'ₓ',
  '^a': 'ᵃ',
  '^b': 'ᵇ',
  '^c': 'ᶜ',
  '^d': 'ᵈ',
  '^e': 'ᵉ',
  '^f': 'ᶠ',
  '^g': 'ᵍ',
  '^h': 'ʰ',
  '^i': '^i',
  '^j': 'ʲ',
  '^k': 'ᵏ',
  '^l': 'ˡ',
  '^m': 'ᵐ',
  '^n': 'ⁿ',
  '^o': 'ᵒ',
  '^p': 'ᵖ',
  '^r': 'ʳ',
  '^s': 'ˢ',
  '^t': 'ᵗ',
  '^u': 'ᵘ',
  '^v': 'ᵛ',
  '^w': 'ʷ',
  '^x': 'ˣ',
  '^y': 'ʸ',
  '^z': 'ᶻ',

  '\\pm': '±',
  '\\dotplus': '∔',
  '\\bullet': '∙',
  '\\cdot': '⋅',
  '\\oplus': '⊕',
  '\\ominus': '⊖',
  '\\otimes': '⊗',
  '\\oslash': '⊘',
  '\\odot': '⊙',
  '\\circ': '∘',
  '\\surd': '√',
  '\\propto': '∝',
  '\\angle': '∠',
  '\\measuredangle': '∡',
  '\\sphericalangle': '∢',
  '\\mid': '∣',
  '\\nmid': '∤',
  '\\not\\mid': '∤',
  '\\parallel': '∥',
  '\\nparallel': '∦',
  '\\not\\parallel': '∦',
  '\\flat': '♭',
  '\\natural': '♮',
  '\\sharp': '♯',
};

module.exports = symbols;


/***/ }),
/* 2 */
/***/ ((module) => {

// Used to find all DOM nodes in window.getSelection()
function findNodesBetweenNodes(u, v) {
  const ancestor = findLowestCommonAncestor(u, v);
  const childrenList = findChildrenList(ancestor);
  const [i, j] = [childrenList.indexOf(u), childrenList.indexOf(v)].sort();
  return childrenList.slice(i, j + 1);
}

function findAncestorChain(node) {
  const chain = [];
  chain.push(node);
  while (node.parentNode) {
    node = node.parentNode;
    chain.push(node);
  }
  return chain.reverse();
}

function findLowestCommonAncestor(u, v) {
  const uChain = findAncestorChain(u);
  const vChain = findAncestorChain(v);

  let i = 0;
  for (; i < uChain.length; i++) {
    if (uChain[i] !== vChain[i]) {
      break;
    }
  }
  return uChain[i - 1];
}

function findChildrenList(node) {
  const list = [];
  const find = (n) => {
    if (!n) return;
    list.push(n);
    for (const child of Array.from(n.childNodes || [])) {
      find(child);
    }
  };
  find(node);
  return list;
}

module.exports = {
  findLowestCommonAncestor,
  findNodesBetweenNodes,
  findChildrenList,
  findAncestorChain,
};


/***/ }),
/* 3 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const bnb = __webpack_require__(4);

function makeNode(type) {
  return function makeNodeWrapper(parser) {
    return bnb
      .all(bnb.location, parser, bnb.location)
      .map(function makeNode_([start, value, end]) {
        return {
          type,
          start: start.index,
          end: end.index,
          // @ts-ignore
          ...value,
        };
      });
  };
}

const Spaces = bnb.match(/\s*/);

const Superscript = bnb
  .all(
    bnb.match(/\^\s*/),
    bnb.choice(bnb.match(/{[a-zA-Z0-9+-]+}/), bnb.match(/[a-zA-Z0-9+-]/))
  )
  .map(([, b]) => ({
    content: b,
  }))
  .thru(makeNode('Superscript'));

const Subscript = bnb
  .all(
    bnb.match(/_\s*/),
    bnb.choice(bnb.match(/{[a-zA-Z0-9+-]+}/), bnb.match(/[a-zA-Z0-9+-]/))
  )
  .map(([_, b]) => {
    return {
      content: b,
    };
  })
  .thru(makeNode('Subscript'));

const NullaryMacro = bnb
  .choice(bnb.match(/\\[a-zA-Z]+/), bnb.match(/\\\|/))
  .map((x) => {
    return {
      macro: x,
    };
  })
  .thru(makeNode('NullaryMacro'));

const CurlyGroup = bnb
  .match(/\{.*?\}/)
  .map((x) => ({value: x}))
  .thru(makeNode('CurlyGroup'));

const UnaryMacro = bnb
  .all(
    bnb.choice(
      bnb.match(/\\mathbb(?![a-zA-Z])/),
      bnb.match(/\\mathfrak(?![a-zA-Z])/),
      bnb.match(/\\mathcal(?![a-zA-Z])/),
      bnb.match(/\\not(?![a-zA-Z])/)
    ),
    Spaces,
    bnb.choice(
      CurlyGroup,
      NullaryMacro,
      bnb
        .match(/[a-zA-Z0-9]/)
        .map((x) => ({value: x}))
        .thru(makeNode('PlainText'))
    )
  )
  .map(([a, _, c]) => ({
    macro: a,
    argument: c,
  }))
  .thru(makeNode('UnaryMacro'));

const Illegal = bnb
  .match(/[\^_\\]/)
  .map((r) => ({
    value: r,
  }))
  .thru(makeNode('PlainText'));

const PlainText = bnb
  .match(/[^_^\\]+/)
  .map((x) => ({value: x}))
  .thru(makeNode('PlainText'));

const Program = bnb
  .choice(Superscript, Subscript, UnaryMacro, NullaryMacro, Illegal, PlainText)
  .repeat()
  .map((nodes) => {
    return {
      body: nodes,
    };
  })
  .thru(makeNode('Program'));

module.exports = Program;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Parser": () => (/* binding */ Parser),
/* harmony export */   "all": () => (/* binding */ all),
/* harmony export */   "choice": () => (/* binding */ choice),
/* harmony export */   "eof": () => (/* binding */ eof),
/* harmony export */   "fail": () => (/* binding */ fail),
/* harmony export */   "lazy": () => (/* binding */ lazy),
/* harmony export */   "location": () => (/* binding */ location),
/* harmony export */   "match": () => (/* binding */ match),
/* harmony export */   "ok": () => (/* binding */ ok),
/* harmony export */   "text": () => (/* binding */ text)
/* harmony export */ });
/**
 * Represents a parsing action; typically not created directly via `new`.
 */
class Parser {
    /**
     * Creates a new custom parser that performs the given parsing action.
     */
    constructor(action) {
        this.action = action;
    }
    /**
     * Returns a parse result with either the value or error information.
     */
    parse(input) {
        const location = { index: 0, line: 1, column: 1 };
        const context = new Context({ input, location });
        const result = this.skip(eof).action(context);
        if (result.type === "ActionOK") {
            return {
                type: "ParseOK",
                value: result.value,
            };
        }
        return {
            type: "ParseFail",
            location: result.furthest,
            expected: result.expected,
        };
    }
    /**
     * Returns the parsed result or throws an error.
     */
    tryParse(input) {
        const result = this.parse(input);
        if (result.type === "ParseOK") {
            return result.value;
        }
        const { expected, location } = result;
        const { line, column } = location;
        const message = `parse error at line ${line} column ${column}: ` +
            `expected ${expected.join(", ")}`;
        throw new Error(message);
    }
    /**
     * Combines two parsers one after the other, yielding the results of both in
     * an array.
     */
    and(parserB) {
        return new Parser((context) => {
            const a = this.action(context);
            if (a.type === "ActionFail") {
                return a;
            }
            context = context.moveTo(a.location);
            const b = context.merge(a, parserB.action(context));
            if (b.type === "ActionOK") {
                const value = [a.value, b.value];
                return context.merge(b, context.ok(b.location.index, value));
            }
            return b;
        });
    }
    /** Parse both and return the value of the first */
    skip(parserB) {
        return this.and(parserB).map(([a]) => a);
    }
    /** Parse both and return the value of the second */
    next(parserB) {
        return this.and(parserB).map(([, b]) => b);
    }
    /**
     * Try to parse using the current parser. If that fails, parse using the
     * second parser.
     */
    or(parserB) {
        return new Parser((context) => {
            const a = this.action(context);
            if (a.type === "ActionOK") {
                return a;
            }
            return context.merge(a, parserB.action(context));
        });
    }
    /**
     * Parse using the current parser. If it succeeds, pass the value to the
     * callback function, which returns the next parser to use.
     */
    chain(fn) {
        return new Parser((context) => {
            const a = this.action(context);
            if (a.type === "ActionFail") {
                return a;
            }
            const parserB = fn(a.value);
            context = context.moveTo(a.location);
            return context.merge(a, parserB.action(context));
        });
    }
    /**
     * Yields the value from the parser after being called with the callback.
     */
    map(fn) {
        return this.chain((a) => {
            return ok(fn(a));
        });
    }
    /**
     * Returns the callback called with the parser.
     */
    thru(fn) {
        return fn(this);
    }
    /**
     * Returns a parser which parses the same value, but discards other error
     * messages, using the ones supplied instead.
     */
    desc(expected) {
        return new Parser((context) => {
            const result = this.action(context);
            if (result.type === "ActionOK") {
                return result;
            }
            return { type: "ActionFail", furthest: result.furthest, expected };
        });
    }
    /**
     * Wraps the current parser with before & after parsers.
     */
    wrap(before, after) {
        return before.next(this).skip(after);
    }
    /**
     * Ignores content before and after the current parser, based on the supplied
     * parser.
     */
    trim(beforeAndAfter) {
        return this.wrap(beforeAndAfter, beforeAndAfter);
    }
    /**
     * Repeats the current parser between min and max times, yielding the results
     * in an array.
     */
    repeat(min = 0, max = Infinity) {
        if (!isRangeValid(min, max)) {
            throw new Error(`repeat: bad range (${min} to ${max})`);
        }
        if (min === 0) {
            return this.repeat(1, max).or(ok([]));
        }
        return new Parser((context) => {
            const items = [];
            let result = this.action(context);
            if (result.type === "ActionFail") {
                return result;
            }
            while (result.type === "ActionOK" && items.length < max) {
                items.push(result.value);
                if (result.location.index === context.location.index) {
                    throw new Error("infinite loop detected; don't call .repeat() with parsers that can accept zero characters");
                }
                context = context.moveTo(result.location);
                result = context.merge(result, this.action(context));
            }
            if (result.type === "ActionFail" && items.length < min) {
                return result;
            }
            return context.merge(result, context.ok(context.location.index, items));
        });
    }
    /**
     * Returns a parser that parses between min and max times, separated by the separator
     * parser supplied.
     */
    sepBy(separator, min = 0, max = Infinity) {
        if (!isRangeValid(min, max)) {
            throw new Error(`sepBy: bad range (${min} to ${max})`);
        }
        if (min === 0) {
            return this.sepBy(separator, 1, max).or(ok([]));
        }
        // We also know that min=1 due to previous checks, so we can skip the call
        // to `repeat` here
        if (max === 1) {
            return this.map((x) => [x]);
        }
        return this.chain((first) => {
            return separator
                .next(this)
                .repeat(min - 1, max - 1)
                .map((rest) => {
                return [first, ...rest];
            });
        });
    }
    /**
     * Returns a parser that adds name and start/end location metadata.
     */
    node(name) {
        return all(location, this, location).map(([start, value, end]) => {
            const type = "ParseNode";
            return { type, name, value, start, end };
        });
    }
}
function isRangeValid(min, max) {
    return (min <= max &&
        min >= 0 &&
        max >= 0 &&
        Number.isInteger(min) &&
        min !== Infinity &&
        (Number.isInteger(max) || max === Infinity));
}
/**
 * Parser that yields the current `SourceLocation`, containing properties
 * `index`, `line` and `column`.
 */
const location = new Parser((context) => {
    return context.ok(context.location.index, context.location);
});
/**
 * Returns a parser that yields the given value and consumes no input.
 */
function ok(value) {
    return new Parser((context) => {
        return context.ok(context.location.index, value);
    });
}
/**
 * Returns a parser that fails with the given messages and consumes no input.
 */
function fail(expected) {
    return new Parser((context) => {
        return context.fail(context.location.index, expected);
    });
}
/**
 * This parser succeeds if the input has already been fully parsed.
 */
const eof = new Parser((context) => {
    if (context.location.index < context.input.length) {
        return context.fail(context.location.index, ["<EOF>"]);
    }
    return context.ok(context.location.index, "<EOF>");
});
/** Returns a parser that matches the exact text supplied. */
function text(string) {
    return new Parser((context) => {
        const start = context.location.index;
        const end = start + string.length;
        if (context.input.slice(start, end) === string) {
            return context.ok(end, string);
        }
        return context.fail(start, [string]);
    });
}
/**
 * Returns a parser that matches the entire regular expression at the current
 * parser position.
 */
function match(regexp) {
    for (const flag of regexp.flags) {
        switch (flag) {
            case "i": // ignoreCase
            case "s": // dotAll
            case "m": // multiline
            case "u": // unicode
                continue;
            default:
                throw new Error("only the regexp flags 'imsu' are supported");
        }
    }
    const sticky = new RegExp(regexp.source, regexp.flags + "y");
    return new Parser((context) => {
        const start = context.location.index;
        sticky.lastIndex = start;
        const match = context.input.match(sticky);
        if (match) {
            const end = start + match[0].length;
            const string = context.input.slice(start, end);
            return context.ok(end, string);
        }
        return context.fail(start, [String(regexp)]);
    });
}
/** Parse all items, returning their values in the same order. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function all(...parsers) {
    // TODO: This could be optimized with a custom parser, but I should probably add
    // benchmarking first to see if it really matters enough to rewrite it
    return parsers.reduce((acc, p) => {
        return acc.chain((array) => {
            return p.map((value) => {
                return [...array, value];
            });
        });
    }, ok([]));
}
/** Parse using the parsers given, returning the first one that succeeds. */
function choice(...parsers) {
    // TODO: This could be optimized with a custom parser, but I should probably add
    // benchmarking first to see if it really matters enough to rewrite it
    return parsers.reduce((acc, p) => {
        return acc.or(p);
    });
}
/**
 * Takes a lazily invoked callback that returns a parser, so you can create
 * recursive parsers.
 */
function lazy(fn) {
    // NOTE: This parsing action overwrites itself on the specified parser. We're
    // assuming that the same parser won't be returned to multiple `lazy` calls. I
    // never heard of such a thing happening in Parsimmon, and it doesn't seem
    // likely to happen here either. I assume this is faster than using variable
    // closure and an `if`-statement here, but I honestly don't know.
    const parser = new Parser((context) => {
        parser.action = fn().action;
        return parser.action(context);
    });
    return parser;
}
function union(a, b) {
    return [...new Set([...a, ...b])];
}
/**
 * Represents the current parsing context.
 */
class Context {
    constructor(options) {
        this.input = options.input;
        this.location = options.location;
    }
    /**
     * Returns a new context with the supplied location and the current input.
     */
    moveTo(location) {
        return new Context({
            input: this.input,
            location,
        });
    }
    _internal_move(index) {
        if (index === this.location.index) {
            return this.location;
        }
        const start = this.location.index;
        const end = index;
        const chunk = this.input.slice(start, end);
        let { line, column } = this.location;
        for (const ch of chunk) {
            if (ch === "\n") {
                line++;
                column = 1;
            }
            else {
                column++;
            }
        }
        return { index, line, column };
    }
    /**
     * Represents a successful parse ending before the given `index`, with the
     * specified `value`.
     */
    ok(index, value) {
        return {
            type: "ActionOK",
            value,
            location: this._internal_move(index),
            furthest: { index: -1, line: -1, column: -1 },
            expected: [],
        };
    }
    /**
     * Represents a failed parse starting at the given `index`, with the specified
     * list `expected` messages (note: this list usually only has one item).
     */
    fail(index, expected) {
        return {
            type: "ActionFail",
            furthest: this._internal_move(index),
            expected,
        };
    }
    /**
     * Merge two sequential `ActionResult`s so that the `expected` and location data
     * is preserved correctly.
     */
    merge(a, b) {
        if (b.furthest.index > a.furthest.index) {
            return b;
        }
        const expected = b.furthest.index === a.furthest.index
            ? union(a.expected, b.expected)
            : a.expected;
        if (b.type === "ActionOK") {
            return {
                type: "ActionOK",
                location: b.location,
                value: b.value,
                furthest: a.furthest,
                expected,
            };
        }
        return {
            type: "ActionFail",
            furthest: a.furthest,
            expected,
        };
    }
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	TexToUnicode = __webpack_exports__;
/******/ 	
/******/ })()
;