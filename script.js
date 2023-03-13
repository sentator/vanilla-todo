"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const app = document.querySelector(".app");
	const headerForm = app.querySelector(".header__form");
	const headerTextfield = headerForm.querySelector(".header__textfield");
	const todosContainer = app.querySelector(".todos");
	const formFilters = app.querySelector(".footer__filters");

	const initialState = getTodosFromLocalStorage();
	// implementing storage with an emitter-------
	const store = new Store(initialState);
	store.onAdd((item) => {
		console.log("added", item);
		updateApp();
	});
	store.onChange((item) => {
		console.log("changed", item);
		updateApp(false);
	});
	store.onDelete((item) => {
		console.log("deleted", item);
		updateApp();
	});
	// -------

	// getting current filter from the searchParams
	const searchParams = new URLSearchParams(window.location.search);
	let activeFilter = searchParams.get("filter") || "all";

	// event listeners
	headerForm.addEventListener("submit", handleFormSubmit);
	app.addEventListener("click", handleClickAction);
	formFilters.addEventListener("change", handleChangeFilter);
	todosContainer.addEventListener("dblclick", handleTodoEdit);

	// // on first render
	updateApp();
	updateActiveFilter(activeFilter);

	// functions
	function handleFormSubmit(event) {
		event.preventDefault();

		const value = headerTextfield.value;

		if (value) {
			const todo = {
				id: Date.now().toString(),
				value,
				completed: false,
			};

			store.add(todo);
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

	function renderList() {
		let ul = todosContainer.querySelector(".todos__list");

		if (ul) {
			ul.innerHTML = "";
		} else {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			todosContainer.append(ul);
		}

		const filteredList = filterTodos(store._items, activeFilter);
		filteredList.forEach((todo) => {
			const todoElement = createTodoElement(todo);
			ul.insertAdjacentHTML("beforeend", todoElement);
		});

		app.setAttribute("data-empty", !store._totalItemsQuantity);
	}

	function updateTodosLeftInfo() {
		const footerLeftElement = app.querySelector(".footer__left");
		const content = store._activeItemsQuantity === 1 ? "1 item left" : `${store._activeItemsQuantity} items left`;

		footerLeftElement.textContent = content;
	}

	function updateTogglerCheckboxStatus() {
		const checkboxElement = app.querySelector(".toggle-all__input");

		checkboxElement.checked = store._totalItemsQuantity === store._completedItemsQuantity;
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

			const currentItem = store._items.find((todo) => todo.id === id);
			const newItem = { ...currentItem, completed: !currentItem.completed };
			store.update(newItem);
			newItem.completed
				? targetElement.closest(".item-todo").classList.add("completed")
				: targetElement.closest(".item-todo").classList.remove("completed");

			activeFilter !== "all" ? renderList() : null;
		}

		// handle click on button-remove inside an item-todo
		if (
			targetElement.classList.contains("item-todo__btn-remove") ||
			targetElement.classList.contains("item-todo__remove")
		) {
			const id = targetElement.closest(".item-todo").getAttribute("data-todo");
			const currentItem = store._items.find((todo) => todo.id === id);

			if (confirm("Do you want to remove the todo?")) {
				store.remove(currentItem);
			}
		}

		// handle click on the toggle-all checkbox
		if (targetElement.classList.contains("toggle-all__input")) {
			const isChecked = targetElement.checked;
			const inputCheckboxElements = todosContainer.querySelectorAll(".item-todo .checkbox__input");

			store._items.forEach((item) => {
				store.update({ ...item, completed: isChecked });
			});

			inputCheckboxElements.forEach((checkboxElement) => {
				checkboxElement.checked = isChecked;
				isChecked
					? checkboxElement.closest(".item-todo").classList.add("completed")
					: checkboxElement.closest(".item-todo").classList.remove("completed");
			});

			activeFilter !== "all" && renderList();
		}

		// handle click on the footer__btn-clear-completed button
		if (targetElement.classList.contains("footer__btn-clear-completed")) {
			if (confirm("Do you want to remove competed tasks?")) {
				store._items.forEach((item) => {
					item.completed && store.remove(item);
				});
			}
		}
	}

	function handleChangeFilter(event) {
		const selectedFilter = event.target.value;

		const url =
			selectedFilter !== "all"
				? `${window.location.pathname}?filter=${selectedFilter}`
				: window.location.pathname;

		history.pushState(null, "", url);

		updateActiveFilter(selectedFilter);
		renderList();
	}

	function toggleClearCompletedBtn() {
		const buttonElement = app.querySelector(".footer__btn-clear-completed");
		store._completedItemsQuantity
			? buttonElement.classList.add("visible")
			: buttonElement.classList.remove("visible");
	}

	function saveTodosToLocalStorage() {
		const json = JSON.stringify(store._items);
		localStorage.setItem("TODOS", json);
	}

	function getTodosFromLocalStorage() {
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

	function updateApp(shouldRerenderTodoList = true) {
		saveTodosToLocalStorage();
		shouldRerenderTodoList && renderList();
		updateTodosLeftInfo();
		updateTogglerCheckboxStatus();
		toggleClearCompletedBtn();
	}

	function handleTodoEdit(event) {
		event.preventDefault();

		const targetElement = event.target;

		if (targetElement && targetElement.matches(".item-todo")) {
			const id = targetElement.getAttribute("data-todo");
			const currentItem = store._items.find((todo) => todo.id === id);
			const formEditElement = document.createElement("form");
			const inputEditElement = document.createElement("input");

			formEditElement.classList.add("item-todo__form-edit");
			inputEditElement.setAttribute("type", "text");
			inputEditElement.classList.add("item-todo__input-edit");
			inputEditElement.value = currentItem.value;

			formEditElement.append(inputEditElement);
			targetElement.append(formEditElement);
			targetElement.classList.add("editing");
			inputEditElement.focus();

			const handleFormFocusOut = (e) => {
				e.preventDefault();

				const value = inputEditElement.value;

				if (value) {
					store.update({ ...currentItem, value });
					renderList();
				} else {
					confirm("Do you want to remove the todo?") && store.remove(currentItem);
				}

				targetElement.classList.remove("editing");
			};

			const handleFormSubmitting = (e) => {
				formEditElement.removeEventListener("focusout", handleFormFocusOut);
				handleFormFocusOut(e);
			};

			formEditElement.addEventListener("submit", handleFormSubmitting, { once: true });
			formEditElement.addEventListener("focusout", handleFormFocusOut, { once: true });
		}
	}
});
