"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const app = document.querySelector(".app");
	const headerForm = app.querySelector(".header__form");
	const toggleAllCheckboxElement = app.querySelector(".toggle-all__input");
	const headerTextfield = headerForm.querySelector(".header__textfield");
	const todosContainer = app.querySelector(".todos");
	const footerLeftElement = app.querySelector(".footer__left");
	const formFilters = app.querySelector(".footer__filters");
	const filterButtons = formFilters.querySelectorAll(".todo-filter__input");
	const clearCompletedButton = app.querySelector(".footer__btn-clear-completed");

	const initialState = getTodosFromLocalStorage();

	// implementing storage with an emitter-------
	const store = new Store(initialState);

	store.onAdd(addListItem);
	store.onChange(changeListItems);
	store.onDelete(removeListItems);
	store.onStateChange(updateCounters);
	store.onStateChange(updateFooter);
	store.onStateChange(saveTodosToLocalStorage);
	// -------

	// getting current filter from the searchParams
	const searchParams = new URLSearchParams(window.location.search);
	let activeFilter = searchParams.get("filter") || "all";

	// event listeners
	headerForm.addEventListener("submit", addNewTodo);
	todosContainer.addEventListener("click", toggleTodoStatus);
	todosContainer.addEventListener("click", removeTodo);
	app.addEventListener("click", removeAllCompletedTodos);
	toggleAllCheckboxElement.addEventListener("change", toggleAllCheckboxes);
	formFilters.addEventListener("change", changeFilter);
	todosContainer.addEventListener("dblclick", showTodoEditForm);

	// on first render
	renderApp(initialState);

	// functions
	function addListItem(item) {
		let ul = todosContainer.querySelector(".todos__list");

		if (!ul) {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			todosContainer.append(ul);
		}

		// decide on the need of rendering the item
		if (
			activeFilter === "all" ||
			(activeFilter === "active" && !item.completed) ||
			(activeFilter === "completed" && item.completed)
		) {
			const li = createTodoHTML(item);
			ul.insertAdjacentHTML("beforeend", li);
		}
	}

	function changeListItems(updatedItems) {
		let ul = todosContainer.querySelector(".todos__list");

		if (!ul) {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			todosContainer.append(ul);
		}

		updatedItems.forEach((item) => {
			const { id, value, completed } = item;
			const itemElement = todosContainer.querySelector(`.item-todo[data-todo="${id}"]`);
			const satisfiesActiveFilter =
				activeFilter === "all" ||
				(activeFilter === "active" && !completed) ||
				(activeFilter === "completed" && completed);

			// decide on the need of rendering the item
			if (itemElement) {
				const inputCheckboxElement = itemElement.querySelector(".checkbox__input");
				const itemValueElement = itemElement.querySelector(".item-todo__value");

				if (satisfiesActiveFilter) {
					inputCheckboxElement.checked = completed;
					itemValueElement.textContent = value;
					completed ? itemElement.classList.add("completed") : itemElement.classList.remove("completed");
					return;
				}

				itemElement.closest(".todos__item").remove();
				return;
			}

			if (satisfiesActiveFilter) {
				const li = createTodoHTML(item);
				ul.insertAdjacentHTML("beforeend", li);
			}
		});
	}

	function removeListItems(deletedItems) {
		deletedItems.forEach((item) => {
			const { id } = item;
			const todoElement = todosContainer.querySelector(`.item-todo[data-todo="${id}"]`);

			if (todoElement) {
				const liElement = todoElement.closest(".todos__item");
				liElement.remove();
			}
		});
	}

	function updateCounters(items) {
		const { activeItems, completedItems } = items.reduce(
			(acc, item) => {
				item.completed ? acc.completedItems++ : acc.activeItems++;
				return acc;
			},
			{
				activeItems: 0,
				completedItems: 0,
			}
		);

		toggleAllCheckboxElement.checked = !!items.length && completedItems === items.length;
		footerLeftElement.textContent = activeItems === 1 ? "1 item left" : `${activeItems} items left`;
		completedItems
			? clearCompletedButton.classList.add("visible")
			: clearCompletedButton.classList.remove("visible");
	}

	function updateFooter(items) {
		app.setAttribute("data-empty", !items.length);
	}

	function showFilteredItems(filteredItems) {
		let ul = todosContainer.querySelector(".todos__list");

		if (!ul) {
			ul = document.createElement("ul");
			ul.classList.add("todos__list");
			todosContainer.append(ul);
		}

		ul.innerHTML = "";
		filteredItems.forEach((item) => {
			const li = createTodoHTML(item);
			ul.insertAdjacentHTML("beforeend", li);
		});
	}

	function addNewTodo(event) {
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

	function createTodoHTML(todo) {
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

	function toggleTodoStatus(event) {
		const targetElement = event.target;

		if (targetElement.classList.contains("checkbox__input")) {
			const id = targetElement.getAttribute("id");

			const currentItem = store._items.find((todo) => todo.id === id);
			const newItem = { ...currentItem, completed: !currentItem.completed };
			store.update([newItem]);
		}
	}

	function removeTodo(event) {
		const targetElement = event.target;

		if (
			targetElement.classList.contains("item-todo__btn-remove") ||
			targetElement.classList.contains("item-todo__remove")
		) {
			const id = targetElement.closest(".item-todo").getAttribute("data-todo");

			if (confirm("Do you want to remove the todo?")) {
				const filterCallback = (items) => items.id !== id;
				store.remove(filterCallback);
			}
		}
	}

	function toggleAllCheckboxes(event) {
		const isChecked = event.target.checked;
		const updatedItems = store._items.map((item) => ({ ...item, completed: isChecked }));

		store.update(updatedItems);
	}

	function removeAllCompletedTodos(event) {
		const targetElement = event.target;

		if (targetElement.classList.contains("footer__btn-clear-completed")) {
			if (confirm("Do you want to remove competed tasks?")) {
				const filterCallback = (items) => !items.completed;
				store.remove(filterCallback);
			}
		}
	}

	function updateActiveFilter(filter) {
		filterButtons.forEach((button) => {
			if (button.value === filter) {
				button.checked = true;
			}
		});

		activeFilter = filter;
	}

	function changeFilter(event) {
		const selectedFilter = event.target.value;
		let filteredItems;

		switch (selectedFilter) {
			case "active":
				filteredItems = store._items.filter((todo) => !todo.completed);
				break;
			case "completed":
				filteredItems = store._items.filter((todo) => todo.completed);
				break;
			case "all":
			default:
				filteredItems = [...store._items];
				break;
		}

		const url =
			selectedFilter !== "all"
				? `${window.location.pathname}?filter=${selectedFilter}`
				: window.location.pathname;

		history.pushState(null, "", url);

		updateActiveFilter(selectedFilter);
		showFilteredItems(filteredItems);
	}

	function saveTodosToLocalStorage(items) {
		const json = JSON.stringify(items);
		localStorage.setItem("TODOS", json);
	}

	function getTodosFromLocalStorage() {
		const todos = localStorage.getItem("TODOS");

		return todos ? JSON.parse(todos) : [];
	}

	function renderApp(items) {
		items.forEach(addListItem);
		updateCounters(items);
		updateFooter(items);
		updateActiveFilter(activeFilter);
	}

	function showTodoEditForm(event) {
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

			const saveEditedTodo = (e) => {
				e.preventDefault();

				const value = inputEditElement.value;

				if (value) {
					store.update([{ ...currentItem, value }]);
				} else {
					const filterCallback = (item) => item.id !== id;
					confirm("Do you want to remove the todo?") && store.remove(filterCallback);
				}

				targetElement.classList.remove("editing");
			};

			const submitEditedTodo = (e) => {
				formEditElement.removeEventListener("focusout", saveEditedTodo);
				saveEditedTodo(e);
			};

			formEditElement.addEventListener("submit", submitEditedTodo, { once: true });
			formEditElement.addEventListener("focusout", saveEditedTodo, { once: true });
		}
	}
});
