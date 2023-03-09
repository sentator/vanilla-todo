"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const app = document.querySelector(".app");
	const headerForm = app.querySelector(".header__form");
	const headerTextfield = headerForm.querySelector(".header__textfield");
	const todosContainer = app.querySelector(".todos");

	let todos = [];

	headerForm.addEventListener("submit", handleFormSubmit);
	app.addEventListener("click", handleClickAction);

	function handleFormSubmit(event) {
		event.preventDefault();

		const value = headerTextfield.value;

		if (value) {
			todos.push({
				id: Date.now().toString(),
				value,
				completed: false,
			});
			renderTodoList(todos, todosContainer);
			updateTodosLeftInfo(todos);
			updateTogglerCheckboxStatus(todos);
			event.target.reset();
		}
	}

	function createTodoElement(todo) {
		const { id, value, completed } = todo;

		return `
            <li class="todos__item">
                <span class=${"item-todo" + (completed ? " completed" : "")} data-todo="${id}">
                    <span class="item-todo__checkbox">
                        <span class="checkbox">
                            <input class="checkbox__input visually-hidden" type="checkbox" id="${id}" ${
			completed && "checked"
		}/>
                            <label class="checkbox__label" for="${id}"></label>
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

	function renderTodoList(todos, parentElement) {
		let ul = parentElement.querySelector(".todos__list");

		if (ul) {
			ul.innerHTML = "";
		} else {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			parentElement.append(ul);
		}

		if (todos && todos.length) {
			todos.forEach((todo) => {
				const todoElement = createTodoElement(todo);
				ul.insertAdjacentHTML("beforeend", todoElement);
			});

			app.setAttribute("data-empty", false);
		} else {
			app.setAttribute("data-empty", true);
		}
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

		if (todos.every((todo) => todo.completed)) {
			checkboxElement.checked = true;
		} else {
			checkboxElement.checked = false;
		}
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

			updateTodosLeftInfo(todos);
			updateTogglerCheckboxStatus(todos);
		}

		// handle click on button-remove inside an item-todo
		if (targetElement.classList.contains("item-todo__btn-remove")) {
			const id = targetElement.closest(".item-todo").getAttribute("data-todo");

			if (confirm("Do you want to remove the todo?")) {
				todos = todos.filter((todo) => todo.id !== id);

				renderTodoList(todos, todosContainer);
				updateTodosLeftInfo(todos);
				updateTogglerCheckboxStatus(todos);
			}
		}

		// handle click on the toggle-all checkbox
		if (targetElement.classList.contains("toggle-all__input")) {
			if (targetElement.checked) {
				todos.forEach((todo, i) => {
					todos[i] = { ...todo, completed: true };
				});
			} else {
				todos.forEach((todo, i) => {
					todos[i] = { ...todo, completed: false };
				});
			}

			renderTodoList(todos, todosContainer);
			updateTodosLeftInfo(todos);
		}

		// handle click on the footer__btn-clear-completed button
		if (targetElement.classList.contains("footer__btn-clear-completed")) {
			todos = todos.filter((todo) => todo.completed === false);

			renderTodoList(todos, todosContainer);
			updateTodosLeftInfo(todos);
			updateTogglerCheckboxStatus(todos);
		}
	}
});
