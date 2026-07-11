// 待办清单的全部逻辑（按日期分组 + 日历）

// ===== 页面元素 =====
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyHint = document.getElementById("empty-hint");
const countEl = document.getElementById("count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter");
const panelTitle = document.getElementById("panel-title");

const calTitle = document.getElementById("cal-title");
const calDays = document.getElementById("cal-days");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const todayBtn = document.getElementById("today-btn");

const reflectionInput = document.getElementById("reflection-input");
const reflectionSaved = document.getElementById("reflection-saved");

// ===== 日期工具 =====
// 把日期对象转成 "YYYY-MM-DD" 字符串，作为每天的存储键
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = new Date();
const todayKey = dateKey(today);

// ===== 数据层 =====
// 结构：{ "2026-07-11": [ {id, text, done}, ... ], ... }
let store = JSON.parse(localStorage.getItem("todosByDate") || "null");

// 兼容旧版本：把老的单一列表 "todos" 迁移到今天
if (!store) {
  store = {};
  const old = JSON.parse(localStorage.getItem("todos") || "[]");
  if (old.length > 0) {
    store[todayKey] = old;
  }
}

let selectedKey = todayKey; // 当前选中的日期
let viewYear = today.getFullYear(); // 日历正在显示的年
let viewMonth = today.getMonth(); // 日历正在显示的月（0-11）
let filter = "all"; // all | active | done

// 保存到浏览器本地存储
function save() {
  localStorage.setItem("todosByDate", JSON.stringify(store));
}

// 取某一天的任务数组（没有则返回空数组）
function getTodos(key) {
  return store[key] || [];
}

// ===== 反思数据层（独立存储，不影响任务）=====
// 结构：{ "2026-07-11": "今天的反思文字", ... }
let reflections = JSON.parse(localStorage.getItem("reflectionsByDate") || "{}");

function saveReflections() {
  localStorage.setItem("reflectionsByDate", JSON.stringify(reflections));
}

// ===== 任务操作（都作用在当前选中的日期上）=====
function add(text) {
  if (!store[selectedKey]) store[selectedKey] = [];
  store[selectedKey].push({ id: Date.now(), text: text, done: false });
  save();
  renderTasks();
  renderCalendar();
}

function toggle(id) {
  const t = getTodos(selectedKey).find((x) => x.id === id);
  if (t) t.done = !t.done;
  save();
  renderTasks();
}

function remove(id) {
  store[selectedKey] = getTodos(selectedKey).filter((x) => x.id !== id);
  if (store[selectedKey].length === 0) delete store[selectedKey];
  save();
  renderTasks();
  renderCalendar();
}

// ===== 渲染右侧任务清单 =====
function renderTasks() {
  list.innerHTML = "";
  const todos = getTodos(selectedKey);

  const visible = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  visible.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggle(todo.id));

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  emptyHint.style.display = visible.length === 0 ? "block" : "none";

  // 标题：今天显示“今天的待办”，其它日期显示具体日期
  if (selectedKey === todayKey) {
    panelTitle.textContent = "📝 今天的待办";
  } else {
    panelTitle.textContent = "📅 " + selectedKey;
  }

  // 底部：已完成 / 总数
  const doneCount = todos.filter((t) => t.done).length;
  countEl.textContent = `${doneCount} / ${todos.length} 已完成`;

  // 载入这一天的反思
  renderReflection();
}

// 把选中日期的反思填进输入框
function renderReflection() {
  reflectionInput.value = reflections[selectedKey] || "";
  reflectionSaved.textContent = "";
}

// ===== 渲染左侧日历 =====
function renderCalendar() {
  calTitle.textContent = `${viewYear}年${viewMonth + 1}月`;
  calDays.innerHTML = "";

  // 当月第一天是星期几（0=周日），以及当月天数
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // 月初空格
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell empty";
    calDays.appendChild(empty);
  }

  // 每一天
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day);
    const key = dateKey(d);

    const cell = document.createElement("button");
    cell.className = "cal-cell";
    cell.textContent = day;

    if (key === todayKey) cell.classList.add("today");
    if (key === selectedKey) cell.classList.add("selected");

    // 这一天有任务 → 加个小圆点
    if (getTodos(key).length > 0) {
      const dot = document.createElement("span");
      dot.className = "dot";
      cell.appendChild(dot);
    }

    cell.addEventListener("click", () => {
      selectedKey = key;
      renderTasks();
      renderCalendar();
    });

    calDays.appendChild(cell);
  }
}

// ===== 事件绑定 =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  add(text);
  input.value = "";
  input.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    renderTasks();
  });
});

clearDoneBtn.addEventListener("click", () => {
  store[selectedKey] = getTodos(selectedKey).filter((t) => !t.done);
  if (store[selectedKey].length === 0) delete store[selectedKey];
  save();
  renderTasks();
  renderCalendar();
});

// 反思：一边打字一边自动保存
reflectionInput.addEventListener("input", () => {
  const text = reflectionInput.value;
  if (text.trim() === "") {
    delete reflections[selectedKey];
  } else {
    reflections[selectedKey] = text;
  }
  saveReflections();
  reflectionSaved.textContent = "已自动保存 ✓";
});

// 上 / 下个月
prevMonthBtn.addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});

// 回到今天
todayBtn.addEventListener("click", () => {
  selectedKey = todayKey;
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  renderTasks();
  renderCalendar();
});

// ===== 首次渲染 =====
renderTasks();
renderCalendar();

