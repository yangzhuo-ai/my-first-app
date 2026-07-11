// 待办清单的全部逻辑

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyHint = document.getElementById("empty-hint");
const countEl = document.getElementById("count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter");

// 从浏览器本地存储读取已保存的任务
let todos = JSON.parse(localStorage.getItem("todos") || "[]");
let filter = "all"; // all | active | done

// 把当前任务保存到浏览器本地存储
function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// 根据筛选条件把任务画到页面上
function render() {
  list.innerHTML = "";

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

  // 空状态提示
  emptyHint.style.display = visible.length === 0 ? "block" : "none";

  // 底部计数（未完成数量）
  const remaining = todos.filter((t) => !t.done).length;
  countEl.textContent = remaining + " 项待办";
}

// 添加一个新任务
function add(text) {
  todos.push({ id: Date.now(), text: text, done: false });
  save();
  render();
}

// 切换完成状态
function toggle(id) {
  const t = todos.find((x) => x.id === id);
  if (t) t.done = !t.done;
  save();
  render();
}

// 删除一个任务
function remove(id) {
  todos = todos.filter((x) => x.id !== id);
  save();
  render();
}

// 表单提交 = 添加任务
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  add(text);
  input.value = "";
  input.focus();
});

// 筛选按钮
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

// 清除所有已完成
clearDoneBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

// 页面加载时先画一次
render();
