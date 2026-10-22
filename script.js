const exprEl = document.getElementById('expr');
const resultEl = document.getElementById('result');
const OPS = ['+', '−', '×', '÷'];

let tokens = [];          // e.g. ["12", "+", "3"]
let justEvaluated = false;

const isOp = t => OPS.includes(t);
const last = () => tokens[tokens.length - 1];

// Evaluate without eval(): handle × ÷ first, then + −
function evaluate(list) {
  let t = list.filter(x => x !== '-' && x !== '.' && x !== '-.');
  if (isOp(t[t.length - 1])) t = t.slice(0, -1);
  if (!t.length) return null;
  t = t.map(x => (isOp(x) ? x : parseFloat(x)));

  const pass1 = [t[0]];
  for (let i = 1; i < t.length; i += 2) {
    const op = t[i], n = t[i + 1];
    if (op === '×') pass1.push(pass1.pop() * n);
    else if (op === '÷') {
      if (n === 0) return 'Error';
      pass1.push(pass1.pop() / n);
    } else pass1.push(op, n);
  }
  let total = pass1[0];
  for (let i = 1; i < pass1.length; i += 2) {
    total = pass1[i] === '+' ? total + pass1[i + 1] : total - pass1[i + 1];
  }
  return parseFloat(total.toPrecision(12)).toString();
}

function render() {
  exprEl.textContent = tokens.map(t => t.replace('-', '−')).join(' ');
  document.querySelectorAll('.op').forEach(b =>
    b.classList.toggle('active', !justEvaluated && b.dataset.op === last()));

  let text = '0';
  if (tokens.length) {
    if (tokens.length === 1) text = tokens[0];
    else if (isOp(last())) text = tokens[tokens.length - 2];
    else {
      const r = evaluate(tokens);
      text = r === null ? last() : r;
    }
  }
  resultEl.textContent = text.replace('-', '−');
  resultEl.classList.toggle('small', text.length > 11);
}

function inputNum(ch) {
  if (justEvaluated) { tokens = []; justEvaluated = false; }
  const cur = last();
  if (cur === undefined || isOp(cur)) {
    tokens.push(ch === '.' ? '0.' : ch);
  } else {
    if (ch === '.' && cur.includes('.')) return;
    if (cur === '0' && ch !== '.') tokens[tokens.length - 1] = ch;
    else if (cur === '-' && ch === '.') tokens[tokens.length - 1] = '-0.';
    else tokens[tokens.length - 1] = cur + ch;
  }
  render();
}

function inputOp(op) {
  justEvaluated = false;
  if (!tokens.length) {
    if (op === '−') { tokens.push('-'); render(); }
    return;
  }
  if (last() === '-' && tokens.length <= 2) return;
  if (isOp(last())) {
    // minus after × or ÷ means a negative number
    if (op === '−' && (last() === '×' || last() === '÷')) tokens.push('-');
    else tokens[tokens.length - 1] = op;
  } else tokens.push(op);
  render();
}

function equals() {
  if (tokens.length < 3) return;
  const r = evaluate(tokens);
  if (r === null) return;
  if (r === 'Error') {
    tokens = [];
    exprEl.textContent = '';
    resultEl.textContent = 'Cannot divide by 0';
    resultEl.classList.add('small');
    return;
  }
  exprEl.textContent = tokens.map(t => t.replace('-', '−')).join(' ') + ' =';
  tokens = [r];
  justEvaluated = true;
  resultEl.textContent = r.replace('-', '−');
  resultEl.classList.toggle('small', r.length > 11);
}

function clearAll() { tokens = []; justEvaluated = false; render(); }

function del() {
  if (justEvaluated) return clearAll();
  const cur = last();
  if (cur === undefined) return;
  if (isOp(cur) || cur.length === 1) tokens.pop();
  else tokens[tokens.length - 1] = cur.slice(0, -1);
  render();
}

function percent() {
  const cur = last();
  if (cur === undefined || isOp(cur) || cur === '-') return;
  tokens[tokens.length - 1] = parseFloat((parseFloat(cur) / 100).toPrecision(12)).toString();
  render();
}

// Buttons
document.querySelector('.keys').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.num) inputNum(b.dataset.num);
  else if (b.dataset.op) inputOp(b.dataset.op);
  else if (b.dataset.act === 'equals') equals();
  else if (b.dataset.act === 'clear') clearAll();
  else if (b.dataset.act === 'del') del();
  else if (b.dataset.act === 'percent') percent();
});

// Keyboard support (bonus)
const keyMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };
document.addEventListener('keydown', e => {
  const k = e.key;
  let sel = null;
  if (/^[0-9.]$/.test(k)) { inputNum(k); sel = `[data-num="${k}"]`; }
  else if (keyMap[k]) { e.preventDefault(); inputOp(keyMap[k]); sel = `[data-op="${keyMap[k]}"]`; }
  else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); sel = '[data-act="equals"]'; }
  else if (k === 'Backspace') { del(); sel = '[data-act="del"]'; }
  else if (k === 'Escape' || k === 'Delete') { clearAll(); sel = '[data-act="clear"]'; }
  else if (k === '%') { percent(); sel = '[data-act="percent"]'; }
  if (sel) {
    const btn = document.querySelector(sel);
    btn.classList.add('press');
    setTimeout(() => btn.classList.remove('press'), 120);
  }
});

render();
