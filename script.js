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
const todoList = document.getElementById('todoList');
const codeforcesList = document.getElementById('codeforcesList');
const leetcodeList = document.getElementById('leetcodeList');
const todoCount = document.getElementById('todoCount');
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
          leetcode: [],
          todo: []
        };
      }

      const codeforces = Array.isArray(parsed.codeforces)
        ? parsed.codeforces.map((item) => normalizeProblemEntry('codeforces', item))
        : [...defaultProblems.codeforces];
      const leetcode = Array.isArray(parsed.leetcode)
        ? parsed.leetcode.map((item) => normalizeProblemEntry('leetcode', item))
        : [...defaultProblems.leetcode];
      const todo = Array.isArray(parsed.todo)
        ? parsed.todo.map((item) => normalizeProblemEntry(item.platform || 'codeforces', item))
        : [];

      return {
        codeforces,
        leetcode,
        todo
      };
    } catch (error) {
      console.warn('Could not parse saved state, resetting...', error);
    }
  }

  return {
    codeforces: defaultProblems.codeforces.map((item) => normalizeProblemEntry('codeforces', item)),
    leetcode: defaultProblems.leetcode.map((item) => normalizeProblemEntry('leetcode', item)),
    todo: []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createProblemUrl(platform, problemNumber, problemName) {
  const cleanedNumber = String(problemNumber).trim();
  const cleanedName = String(problemName).trim();

  if (platform === 'codeforces') {
    const normalized = cleanedNumber.replace(/\s+/g, '');
    const directMatch = normalized.match(/^(\d+)([A-Za-z])$/);
    const slashMatch = normalized.match(/^(\d+)\/([A-Za-z])$/);

    if (directMatch) {
      return `https://codeforces.com/problemset/problem/${directMatch[1]}/${directMatch[2]}`;
    }

    if (slashMatch) {
      return `https://codeforces.com/problemset/problem/${slashMatch[1]}/${slashMatch[2]}`;
    }

    return `https://codeforces.com/problemset?search=${encodeURIComponent(normalized)}`;
  }

  const slug = cleanedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `problem-${cleanedNumber}`;

  return `https://leetcode.com/problems/${slug}/`;
}

function renderProblemList(listElement, problems) {
  listElement.innerHTML = '';

  if (!problems.length) {
    listElement.innerHTML = '<li class="empty-state">No items yet.</li>';
    return;
  }

  for (const item of problems) {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    const tag = document.createElement('span');
    const addBtn = document.createElement('button');

    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.className = 'problem-link';

    tag.className = 'problem-tag';
    tag.textContent = item.problemNumber;

    anchor.appendChild(tag);
    anchor.appendChild(document.createTextNode(item.name));

    addBtn.type = 'button';
    addBtn.textContent = 'Add to Todo';
    addBtn.className = 'mini-btn';
    addBtn.addEventListener('click', () => addToTodo(item, true));

    li.appendChild(anchor);
    li.appendChild(addBtn);
    listElement.appendChild(li);
  }
}

function renderSummary() {
  const total = state.todo.length;
  const solved = state.todo.filter((item) => item.completed).length;
  const remaining = total - solved;
  const codeforcesTotal = state.codeforces.length;
  const leetcodeTotal = state.leetcode.length;
  const maxValue = Math.max(total, solved, remaining, codeforcesTotal, leetcodeTotal, 1);

  summaryTotal.textContent = String(total);
  summarySolved.textContent = String(solved);
  summaryRemaining.textContent = String(remaining);
  summaryCodeforces.textContent = String(codeforcesTotal);
  summaryLeetcode.textContent = String(leetcodeTotal);
  todoCount.textContent = String(total);
  codeforcesCount.textContent = String(codeforcesTotal);
  leetcodeCount.textContent = String(leetcodeTotal);

  const setBar = (element, value, labelElement, labelValue) => {
    const percent = (value / maxValue) * 100;
    element.style.width = `${percent}%`;
    labelValue.textContent = String(value);
  };

  setBar(barTotal, total, null, barTotalValue);
  setBar(barSolved, solved, null, barSolvedValue);
  setBar(barRemaining, remaining, null, barRemainingValue);
  setBar(barCodeforces, codeforcesTotal, null, barCodeforcesValue);
  setBar(barLeetcode, leetcodeTotal, null, barLeetcodeValue);
}

function renderTodo() {
  todoList.innerHTML = '';

  if (!state.todo.length) {
    todoList.innerHTML = '<li class="empty-state">Your todo list is empty.</li>';
    renderSummary();
    return;
  }

  for (const item of state.todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${item.completed ? 'completed' : ''}`;

    const main = document.createElement('div');
    main.className = 'todo-main';

    const status = document.createElement('span');
    status.className = `status ${item.completed ? 'solved' : 'pending'}`;
    status.textContent = item.completed ? 'Solved' : 'Open';

    const anchor = document.createElement('a');
    const tag = document.createElement('span');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.className = 'problem-link';

    tag.className = 'problem-tag';
    tag.textContent = item.platform === 'codeforces' ? 'CF' : 'LC';

    anchor.appendChild(tag);
    anchor.appendChild(document.createTextNode(`${item.problemNumber} - ${item.name}`));

    main.appendChild(status);
    main.appendChild(anchor);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.className = 'mini-btn';
    completeBtn.textContent = item.completed ? 'Mark Open' : 'Complete';
    completeBtn.addEventListener('click', () => toggleTodoCompletion(item));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'mini-btn delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTodo(item));

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(actions);
    todoList.appendChild(li);
  }

  renderSummary();
}

function findTodoIndex(item) {
  return state.todo.findIndex(
    (entry) =>
      entry.platform === item.platform &&
      entry.problemNumber === item.problemNumber &&
      entry.name === item.name &&
      entry.url === item.url
  );
}

function addToTodo(item, skipRender = false) {
  const alreadyExists = state.todo.some(
    (entry) =>
      entry.platform === item.platform &&
      entry.problemNumber === item.problemNumber &&
      entry.name === item.name
  );

  if (alreadyExists) {
    return;
  }

  state.todo.unshift({
    ...item,
    platform: item.platform || 'codeforces',
    completed: false
  });
  saveState();

  if (!skipRender) {
    renderAll();
  } else {
    renderTodo();
  }
}

function toggleTodoCompletion(item) {
  const index = findTodoIndex(item);
  if (index === -1) {
    return;
  }

  state.todo[index].completed = !state.todo[index].completed;
  saveState();
  renderTodo();
}

function deleteTodo(item) {
  state.todo = state.todo.filter((entry) => !(entry.platform === item.platform && entry.problemNumber === item.problemNumber && entry.name === item.name && entry.url === item.url));
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
    url: createProblemUrl(platform, problemNumber, name)
  };

  state[platform].unshift(item);
  addToTodo(item, false);
  form.reset();
  platformSelect.value = platform;
}

function renderAll() {
  renderProblemList(codeforcesList, state.codeforces);
  renderProblemList(leetcodeList, state.leetcode);
  renderTodo();
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

form.addEventListener('submit', addProblem);
tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});
renderAll();
setActiveTab('home');
