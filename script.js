"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const app = document.querySelector(".app");
	const headerForm = app.querySelector(".header__form");
	const headerTextfield = headerForm.querySelector(".header__textfield");
	const todosContainer = app.querySelector(".todos");
	const formFilters = app.querySelector(".footer__filters");

	let todos = getTodosFromStorage();

	// getting current filter from the searchParams
	const searchParams = new URLSearchParams(window.location.search);
	let activeFilter = searchParams.get("filter") || "all";

	// event listeners
	headerForm.addEventListener("submit", handleFormSubmit);
	app.addEventListener("click", handleClickAction);
	formFilters.addEventListener("change", handleChangeFilter);
	todosContainer.addEventListener("dblclick", handleTodoEdit);

	// on first render
	updateApp(todos);
	updateActiveFilter(activeFilter);

	// functions
	function handleFormSubmit(event) {
		event.preventDefault();

		const value = headerTextfield.value;

		if (value) {
			todos.push({
				id: Date.now().toString(),
				value,
				completed: false,
			});

			updateApp(todos);
			event.target.reset();
		}
	}

	function createTodoElement(todo) {
		const { id, value, completed } = todo;
		const itemTodoClassames = "item-todo" + (completed ? " completed" : "");

		return `
            <li class="todos__item">
                <span class="${itemTodoClassames}" data-todo="${id}">
                    <span class="item-todo__checkbox">
                        <span class="checkbox">
                            <input class="checkbox__input visually-hidden" type="checkbox" id="${id}" ${
			completed && "checked"
		}/>
                            <label class="checkbox__label" for="${id}"></label>
							<button class="item-todo__remove">
								 <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"
										fill="currentColor"
									/>
								</svg>
							</button>
                        </span>
                    </span>
                    <span class="item-todo__value">${value}</span>
                    <button class="item-todo__btn-remove">
                        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </span>
            </li>
            `;
	}

	function renderTodoList(todosList, parentElement) {
		let ul = parentElement.querySelector(".todos__list");

		if (ul) {
			ul.innerHTML = "";
		} else {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			parentElement.append(ul);
		}

		if (todosList && todosList.length) {
			todosList.forEach((todo) => {
				const todoElement = createTodoElement(todo);
				ul.insertAdjacentHTML("beforeend", todoElement);
			});
		}

		app.setAttribute("data-empty", !todos.length);
	}

	function updateTodosLeftInfo(todos) {
		const footerLeftElement = app.querySelector(".footer__left");
		const quantity = todos.reduce((acc, todo) => {
			if (todo.completed) {
				return acc;
			}

			return ++acc;
		}, 0);

		if (quantity === 1) {
			footerLeftElement.textContent = "1 item left";
		} else {
			footerLeftElement.textContent = `${quantity} items left`;
		}
	}

	function updateTogglerCheckboxStatus(todos) {
		const checkboxElement = app.querySelector(".toggle-all__input");

		checkboxElement.checked = todos.every((todo) => todo.completed);
	}

	function updateActiveFilter(filter) {
		const filterButtons = formFilters.querySelectorAll(".todo-filter__input");

		filterButtons.forEach((button) => {
			if (button.value === filter) {
				button.checked = true;
			}
		});

		activeFilter = filter;
	}

	function handleClickAction(event) {
		const targetElement = event.target;

		// handle click on checkbox inside an item-todo
		if (targetElement.classList.contains("checkbox__input")) {
			const id = targetElement.getAttribute("id");

			for (let i = 0; i < todos.length; i++) {
				const todo = todos[i];

				if (todo.id === id) {
					todos[i] = {
						...todo,
						completed: !todo.completed,
					};

					todos[i].completed
						? targetElement.closest(".item-todo").classList.add("completed")
						: targetElement.closest(".item-todo").classList.remove("completed");

					break;
				}
			}

			const filteredTodos = filterTodos(todos, activeFilter);

			activeFilter !== "all" ? renderTodoList(filteredTodos, todosContainer) : null;
			saveTodosToStorage(todos);
			updateTodosLeftInfo(todos);
			updateTogglerCheckboxStatus(todos);
			toggleClearCompletedBtn();
		}

		// handle click on button-remove inside an item-todo
		if (
			targetElement.classList.contains("item-todo__btn-remove") ||
			targetElement.classList.contains("item-todo__remove")
		) {
			const id = targetElement.closest(".item-todo").getAttribute("data-todo");

			if (confirm("Do you want to remove the todo?")) {
				todos = todos.filter((todo) => todo.id !== id);

				updateApp(todos);
			}
		}

		// handle click on the toggle-all checkbox
		if (targetElement.classList.contains("toggle-all__input")) {
			todos = targetElement.checked
				? todos.map((todo) => ({ ...todo, completed: true }))
				: todos.map((todo) => ({ ...todo, completed: false }));

			updateApp(todos);
		}

		// handle click on the footer__btn-clear-completed button
		if (targetElement.classList.contains("footer__btn-clear-completed")) {
			if (confirm("Do you want to remove competed tasks?")) {
				todos = todos.filter((todo) => todo.completed === false);

				updateApp(todos);
			}
		}
	}

	function handleChangeFilter(event) {
		const selectedFilter = event.target.value;
		const filteredTodos = filterTodos(todos, selectedFilter);

		const url =
			selectedFilter !== "all"
				? `${window.location.pathname}?filter=${selectedFilter}`
				: window.location.pathname;

		history.pushState(null, "", url);

		renderTodoList(filteredTodos, todosContainer);
		updateActiveFilter(selectedFilter);
	}

	function toggleClearCompletedBtn() {
		const buttonElement = app.querySelector(".footer__btn-clear-completed");
		todos.some((todo) => todo.completed)
			? buttonElement.classList.add("visible")
			: buttonElement.classList.remove("visible");
	}

	function saveTodosToStorage(todos) {
		const json = JSON.stringify(todos);
		localStorage.setItem("TODOS", json);
	}

	function getTodosFromStorage() {
		const todos = localStorage.getItem("TODOS");

		return todos ? JSON.parse(todos) : [];
	}

	function filterTodos(todos, filter) {
		switch (filter) {
			case "active":
				return todos.filter((todo) => !todo.completed);
			case "completed":
				return todos.filter((todo) => todo.completed);
			case "all":
			default:
				return [...todos];
		}
	}

	function updateApp(todosList) {
		const filteredTodos = filterTodos(todosList, activeFilter);

		saveTodosToStorage(todosList);
		renderTodoList(filteredTodos, todosContainer);
		updateTodosLeftInfo(todosList);
		updateTogglerCheckboxStatus(todosList);
		toggleClearCompletedBtn();
	}

	function handleTodoEdit(event) {
		const targetElement = event.target;

		if (targetElement && targetElement.matches(".item-todo")) {
			const todoId = targetElement.getAttribute("data-todo");
			const { value } = todos.find((todo) => todo.id === todoId);
			const inputEditElement = document.createElement("input");

			inputEditElement.setAttribute("type", "text");
			inputEditElement.classList.add("item-todo__input-edit");
			inputEditElement.value = value;

			targetElement.append(inputEditElement);
			targetElement.classList.add("editing");
			inputEditElement.focus();

			inputEditElement.addEventListener(
				"blur",
				() => {
					const value = inputEditElement.value;

					todos = todos.map((todo) => {
						return todo.id === todoId && value ? { ...todo, value } : todo;
					});
					updateApp(todos);
					targetElement.classList.remove("editing");
				},
				{ once: true }
			);
		}
	}
});
