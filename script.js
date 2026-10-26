const STORAGE_KEY = "todo-list-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const inputFeedback = document.querySelector("#input-feedback");
const storageFeedback = document.querySelector("#storage-feedback");
const todoList = document.querySelector("#todo-list");
const todoTemplate = document.querySelector("#todo-template");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const remainingCount = document.querySelector("#remaining-count");
const progressLabel = document.querySelector("#progress-label");
const progress = document.querySelector('[role="progressbar"]');
const progressBar = document.querySelector("#progress-bar");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = loadTodos();
let activeFilter = "all";

function loadTodos() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every(
        (todo) =>
          todo !== null &&
          typeof todo === "object" &&
          typeof todo.id === "string" &&
          typeof todo.text === "string" &&
          typeof todo.completed === "boolean",
      )
    ) {
      throw new Error("저장된 할 일 데이터의 형식이 올바르지 않습니다.");
    }

    return parsedValue;
  } catch (error) {
    showStorageMessage(
      error instanceof SyntaxError
        ? "저장된 할 일 데이터를 읽을 수 없어 새 목록으로 시작합니다."
        : "저장된 할 일 데이터를 불러오지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      true,
    );
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    showStorageMessage("", false);
  } catch {
    showStorageMessage("변경 내용을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.", true);
  }
}

function showStorageMessage(message, isError) {
  storageFeedback.textContent = message;
  storageFeedback.hidden = message.length === 0;
  storageFeedback.classList.toggle("text-red-600", isError);
  storageFeedback.classList.toggle("text-slate-500", !isError);
}

function getVisibleTodos() {
  if (activeFilter === "pending") {
    return todos.filter((todo) => !todo.completed);
  }

  if (activeFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

function renderTodos() {
  const visibleTodos = getVisibleTodos();
  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;
  const completionRate = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  todoList.replaceChildren(...visibleTodos.map(createTodoElement));
  emptyState.hidden = visibleTodos.length > 0;

  if (todos.length === 0) {
    emptyMessage.textContent = "등록된 할 일이 없습니다. 새로운 할 일을 추가해보세요!";
  } else if (visibleTodos.length === 0) {
    emptyMessage.textContent =
      activeFilter === "pending"
        ? "진행 중인 할 일이 없습니다. 다른 필터를 선택하거나 할 일을 추가해보세요."
        : "완료된 할 일이 없습니다. 다른 필터를 선택하거나 할 일을 추가해보세요.";
  }

  remainingCount.textContent = `남은 할 일 ${pendingCount}개`;
  progressLabel.textContent = `${completionRate}%`;
  progress.setAttribute("aria-valuenow", String(completionRate));
  progressBar.style.width = `${completionRate}%`;
}

function createTodoElement(todo) {
  const item = todoTemplate.content.firstElementChild.cloneNode(true);
  const checkbox = item.querySelector(".todo-checkbox");
  const text = item.querySelector(".todo-text");
  const deleteButton = item.querySelector(".todo-delete");

  item.classList.toggle("is-completed", todo.completed);
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  text.textContent = todo.text;
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);

  checkbox.addEventListener("change", () => {
    todos = todos.map((currentTodo) =>
      currentTodo.id === todo.id ? { ...currentTodo, completed: checkbox.checked } : currentTodo,
    );
    saveTodos();
    renderTodos();
  });

  deleteButton.addEventListener("click", () => {
    todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
    saveTodos();
    renderTodos();
  });

  return item;
}

function clearInputFeedback() {
  inputFeedback.textContent = "";
  inputFeedback.hidden = true;
  input.removeAttribute("aria-invalid");
}

function setActiveFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  renderTodos();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (text.length === 0) {
    inputFeedback.textContent = "할 일 내용을 입력해 주세요.";
    inputFeedback.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  clearInputFeedback();
  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  });
  input.value = "";
  saveTodos();
  setActiveFilter("all");
  input.focus();
});

input.addEventListener("input", clearInputFeedback);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveFilter(button.dataset.filter);
  });
});

renderTodos();
