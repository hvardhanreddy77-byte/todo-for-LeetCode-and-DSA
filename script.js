const STORAGE_KEY = 'problem-portal-state';

const defaultProblems = {
  codeforces: [],
  leetcode: []
};

const state = loadState();

const form = document.getElementById('problemForm');
const platformSelect = document.getElementById('platform');
const problemNumberInput = document.getElementById('problemNumber');
const problemNameInput = document.getElementById('problemName');
const codeforcesList = document.getElementById('codeforcesList');
const leetcodeList = document.getElementById('leetcodeList');
const codeforcesCount = document.getElementById('codeforcesCount');
const leetcodeCount = document.getElementById('leetcodeCount');
const summaryTotal = document.getElementById('summaryTotal');
const summarySolved = document.getElementById('summarySolved');
const summaryRemaining = document.getElementById('summaryRemaining');
const summaryCodeforces = document.getElementById('summaryCodeforces');
const summaryLeetcode = document.getElementById('summaryLeetcode');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabViews = document.querySelectorAll('.tab-view');
const barTotal = document.getElementById('barTotal');
const barSolved = document.getElementById('barSolved');
const barRemaining = document.getElementById('barRemaining');
const barCodeforces = document.getElementById('barCodeforces');
const barLeetcode = document.getElementById('barLeetcode');
const barTotalValue = document.getElementById('barTotalValue');
const barSolvedValue = document.getElementById('barSolvedValue');
const barRemainingValue = document.getElementById('barRemainingValue');
const barCodeforcesValue = document.getElementById('barCodeforcesValue');
const barLeetcodeValue = document.getElementById('barLeetcodeValue');

function normalizeProblemEntry(platform, item = {}) {
  const safePlatform = platform === 'leetcode' ? 'leetcode' : 'codeforces';
  const problemNumber = String(item.problemNumber ?? '').trim();
  const name = String(item.name ?? '').trim();

  return {
    platform: safePlatform,
    problemNumber,
    name,
    url: createProblemUrl(safePlatform, problemNumber, name),
    completed: Boolean(item.completed)
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const hasLegacyDemoEntries =
        Array.isArray(parsed.codeforces) && parsed.codeforces.some((item) => item.problemNumber === '1799A' || item.name === 'A. Codeforces') ||
        Array.isArray(parsed.leetcode) && parsed.leetcode.some((item) => item.problemNumber === '1' || item.name === 'Two Sum');

      if (hasLegacyDemoEntries) {
        localStorage.removeItem(STORAGE_KEY);
        return {
          codeforces: [],
          leetcode: []
        };
      }

      const codeforces = Array.isArray(parsed.codeforces)
        ? parsed.codeforces.map((item) => normalizeProblemEntry('codeforces', item))
        : [...defaultProblems.codeforces];
      const leetcode = Array.isArray(parsed.leetcode)
        ? parsed.leetcode.map((item) => normalizeProblemEntry('leetcode', item))
        : [...defaultProblems.leetcode];

      return {
        codeforces,
        leetcode
      };
    } catch (error) {
      console.warn('Could not parse saved state, resetting...', error);
    }
  }

  return {
    codeforces: defaultProblems.codeforces.map((item) => normalizeProblemEntry('codeforces', item)),
    leetcode: defaultProblems.leetcode.map((item) => normalizeProblemEntry('leetcode', item))
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createProblemUrl(platform, problemNumber, problemName) {
  const cleanedNumber = String(problemNumber ?? '').trim();
  const cleanedName = String(problemName ?? '').trim();

  if (platform === 'codeforces') {
    const normalized = cleanedNumber
      .replace(/^(?:https?:\/\/)?(?:www\.)?codeforces\.com\/.*?problem(?:set)?\//i, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .trim();

    if (/^\d+[A-Za-z]?$/.test(normalized)) {
      return `https://codeforces.com/problemset/problem/${normalized}`;
    }

    if (normalized) {
      return `https://codeforces.com/problemset?search=${encodeURIComponent(normalized)}`;
    }

    if (cleanedName) {
      return `https://codeforces.com/problemset?search=${encodeURIComponent(cleanedName)}`;
    }

    return 'https://codeforces.com/problemset';
  }

  const slug = cleanedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `problem-${cleanedNumber || 'new'}`;

  return `https://leetcode.com/problems/${slug}/`;
}

function renderProblemList(listElement, problems, platform) {
  listElement.innerHTML = '';

  if (!problems.length) {
    listElement.innerHTML = '<li class="empty-state">No items yet.</li>';
    return;
  }

  for (const item of problems) {
    const li = document.createElement('li');
    li.className = `todo-item ${item.completed ? 'completed' : ''}`;

    const anchor = document.createElement('a');
    const tag = document.createElement('span');
    const actions = document.createElement('div');
    const completeBtn = document.createElement('button');
    const deleteBtn = document.createElement('button');

    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.className = 'problem-link';

    tag.className = 'problem-tag';
    tag.textContent = platform === 'codeforces' ? 'CF' : 'LC';

    anchor.appendChild(tag);
    anchor.appendChild(document.createTextNode(`${item.problemNumber} - ${item.name}`));

    completeBtn.type = 'button';
    completeBtn.className = 'mini-btn';
    completeBtn.textContent = item.completed ? 'Mark Open' : 'Complete';
    completeBtn.addEventListener('click', () => toggleProblemCompletion(platform, item));

    deleteBtn.type = 'button';
    deleteBtn.className = 'mini-btn delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePlatformProblem(platform, item));

    actions.className = 'todo-actions';
    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(anchor);
    li.appendChild(actions);
    listElement.appendChild(li);
  }
}

function renderSummary() {
  const codeforcesTotal = state.codeforces.length;
  const leetcodeTotal = state.leetcode.length;
  const total = codeforcesTotal + leetcodeTotal;
  const solved = [...state.codeforces, ...state.leetcode].filter((item) => item.completed).length;
  const remaining = total - solved;
  const maxValue = Math.max(total, solved, remaining, codeforcesTotal, leetcodeTotal, 1);

  summaryTotal.textContent = String(total);
  summarySolved.textContent = String(solved);
  summaryRemaining.textContent = String(remaining);
  summaryCodeforces.textContent = String(codeforcesTotal);
  summaryLeetcode.textContent = String(leetcodeTotal);
  codeforcesCount.textContent = String(codeforcesTotal);
  leetcodeCount.textContent = String(leetcodeTotal);

  const setBar = (element, value, labelValue) => {
    const percent = (value / maxValue) * 100;
    element.style.width = `${percent}%`;
    labelValue.textContent = String(value);
  };

  setBar(barTotal, total, barTotalValue);
  setBar(barSolved, solved, barSolvedValue);
  setBar(barRemaining, remaining, barRemainingValue);
  setBar(barCodeforces, codeforcesTotal, barCodeforcesValue);
  setBar(barLeetcode, leetcodeTotal, barLeetcodeValue);
}

function toggleProblemCompletion(platform, item) {
  const pool = state[platform];
  if (!Array.isArray(pool)) {
    return;
  }

  const index = pool.findIndex(
    (entry) =>
      entry.platform === item.platform &&
      entry.problemNumber === item.problemNumber &&
      entry.name === item.name
  );

  if (index !== -1) {
    pool[index].completed = !pool[index].completed;
    saveState();
    renderAll();
  }
}

function deletePlatformProblem(platform, item) {
  const pool = state[platform];
  if (!Array.isArray(pool)) {
    return;
  }

  state[platform] = pool.filter(
    (entry) => !(entry.platform === item.platform && entry.problemNumber === item.problemNumber && entry.name === item.name)
  );

  saveState();
  renderAll();
}

function addProblem(event) {
  event.preventDefault();

  const platform = platformSelect.value;
  const problemNumber = problemNumberInput.value.trim();
  const name = problemNameInput.value.trim();

  if (!problemNumber || !name) {
    return;
  }

  const item = {
    platform,
    problemNumber,
    name,
    url: createProblemUrl(platform, problemNumber, name),
    completed: false
  };

  const exists = state[platform].some(
    (entry) => entry.problemNumber === item.problemNumber && entry.name === item.name
  );

  if (exists) {
    form.reset();
    platformSelect.value = platform;
    return;
  }

  state[platform].unshift(item);
  saveState();
  renderAll();
  form.reset();
  platformSelect.value = platform;
}

function renderAll() {
  renderProblemList(codeforcesList, state.codeforces, 'codeforces');
  renderProblemList(leetcodeList, state.leetcode, 'leetcode');
  renderSummary();
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle('active', active);
  });

  tabViews.forEach((view) => {
    const active = view.id === `${tabName}View`;
    view.classList.toggle('active', active);
  });
}

if (form) {
  form.addEventListener('submit', addProblem);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});
renderAll();
setActiveTab('home');
