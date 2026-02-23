const filterInput = document.getElementById('rule-filter');
const ruleCards = Array.from(document.querySelectorAll('.rule-card'));
const ruleCount = document.getElementById('rule-count');
const rulesets = Array.from(document.querySelectorAll('.ruleset'));
const navLinks = Array.from(document.querySelectorAll('.sidebar a'));

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function highlightWithPatterns(source, pattern, classify) {
  let output = '';
  let lastIndex = 0;
  let match;

  pattern.lastIndex = 0;

  while ((match = pattern.exec(source)) !== null) {
    const [token] = match;
    const start = match.index;

    if (start > lastIndex) {
      output += escapeHtml(source.slice(lastIndex, start));
    }

    const tokenClass = classify(match);
    if (tokenClass === null) {
      output += escapeHtml(token);
    } else {
      output += `<span class="${tokenClass}">${escapeHtml(token)}</span>`;
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < source.length) {
    output += escapeHtml(source.slice(lastIndex));
  }

  return output;
}

function highlightPhp(source) {
  const keywordPattern = [
    'abstract', 'array', 'as', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'declare', 'default', 'do', 'echo', 'else', 'elseif', 'enum', 'extends', 'false',
    'final', 'finally', 'fn', 'for', 'foreach', 'function', 'if', 'implements', 'interface',
    'match', 'namespace', 'new', 'null', 'private', 'protected', 'public', 'readonly',
    'return', 'static', 'switch', 'throw', 'trait', 'true', 'try', 'use', 'while',
  ].join('|');

  const pattern = new RegExp(
    [
      '<\\?(?:php)?|\\?>',
      '\\/\\*[\\s\\S]*?\\*\\/',
      '\\/\\/[^\\n]*|#[^\\n]*',
      '"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'',
      '\\$[A-Za-z_][A-Za-z0-9_]*',
      '\\b(?:' + keywordPattern + ')\\b',
      '->|=>|::',
      '\\b\\d+(?:\\.\\d+)?\\b',
    ].join('|'),
    'gm'
  );

  return highlightWithPatterns(source, pattern, match => {
    const token = match[0];

    if (token.startsWith('<?') || token === '?>') {
      return 'tok-tag';
    }
    if (token.startsWith('/*') || token.startsWith('//') || token.startsWith('#')) {
      return 'tok-comment';
    }
    if (token.startsWith('"') || token.startsWith('\'')) {
      return 'tok-string';
    }
    if (token.startsWith('$')) {
      return 'tok-var';
    }
    if (/^(->|=>|::)$/.test(token)) {
      return 'tok-op';
    }
    if (/^\d/.test(token)) {
      return 'tok-number';
    }

    return 'tok-keyword';
  });
}

function highlightBash(source) {
  const keywordPattern = [
    'if', 'then', 'fi', 'for', 'in', 'do', 'done', 'case', 'esac', 'while', 'function',
  ].join('|');

  const pattern = new RegExp(
    [
      '#[^\\n]*',
      '"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'',
      '\\$\\{[^}]+\\}|\\$[A-Za-z_][A-Za-z0-9_]*',
      '--[A-Za-z0-9-]+',
      '\\b(?:' + keywordPattern + ')\\b',
      '\\b(?:composer|php|cp|vendor\\/bin\\/readalizer)\\b',
    ].join('|'),
    'gm'
  );

  return highlightWithPatterns(source, pattern, match => {
    const token = match[0];

    if (token.startsWith('#')) {
      return 'tok-comment';
    }
    if (token.startsWith('"') || token.startsWith('\'')) {
      return 'tok-string';
    }
    if (token.startsWith('$')) {
      return 'tok-var';
    }
    if (token.startsWith('--')) {
      return 'tok-flag';
    }
    if (/^(if|then|fi|for|in|do|done|case|esac|while|function)$/.test(token)) {
      return 'tok-keyword';
    }

    return 'tok-func';
  });
}

function highlightCodeBlocks() {
  const blocks = Array.from(document.querySelectorAll('pre code[class*="language-"]'));

  blocks.forEach(block => {
    if (block.dataset.highlighted === 'true') {
      return;
    }

    const source = block.textContent ?? '';
    let highlighted = null;

    if (block.classList.contains('language-php')) {
      highlighted = highlightPhp(source);
    } else if (block.classList.contains('language-bash')) {
      highlighted = highlightBash(source);
    }

    if (highlighted !== null) {
      block.innerHTML = highlighted;
      block.dataset.highlighted = 'true';
    }
  });
}

function updateCount() {
  const visible = ruleCards.filter(card => !card.classList.contains('hidden')).length;
  ruleCount.textContent = `${visible} rules shown`;
}

function filterRules() {
  const term = filterInput.value.trim().toLowerCase();
  ruleCards.forEach(card => {
    const haystack = card.dataset.search || '';
    if (!term || haystack.includes(term)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });

  rulesets.forEach(section => {
    const visibleChild = section.querySelector('.rule-card:not(.hidden)');
    section.classList.toggle('hidden', !visibleChild);
  });

  updateCount();
}

if (filterInput) {
  filterInput.addEventListener('input', filterRules);
  updateCount();
}

const sections = Array.from(document.querySelectorAll('main section'));
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px', threshold: 0.1 }
);

sections.forEach(section => observer.observe(section));

highlightCodeBlocks();
