"use strict";

class EventEmitter {
	constructor() {
		this.events = {};
	}
	subscribe(eventName, callback) {
		!this.events[eventName] && (this.events[eventName] = []);
		this.events[eventName].push(callback);
	}
	unsubscribe(eventName, callback) {
		this.events[eventName] = this.events[eventName].filter((eventCallback) => callback !== eventCallback);
	}
	emit(eventName, args) {
		const event = this.events[eventName];
		event && event.forEach((callback) => callback.call(null, args));
	}
}

class Store {
	constructor(initialState = []) {
		this._items = initialState;
		this._emitter = new EventEmitter();
		this._activeItemsQuantity = initialState.reduce((acc, item) => {
			return item.completed ? acc : ++acc;
		}, 0);
		this._completedItemsQuantity = initialState.reduce((acc, item) => {
			return item.completed ? ++acc : acc;
		}, 0);
		this._totalItemsQuantity = initialState.length;
	}

	add(item) {
		this._items.push(item);
		this.updateItemsQuantity();
		this._emitter.emit("event:add_item", item);
	}
	remove(item) {
		this._items = this._items.filter((todo) => todo.id !== item.id);
		this.updateItemsQuantity();
		this._emitter.emit("event:remove_item", item);
	}
	update(item) {
		const prevItem = this._items.find((todo) => todo.id === item.id);
		this._items = this._items.map((todo) => (todo.id === item.id ? item : todo));
		this.updateItemsQuantity();
		this._emitter.emit("event:update_item", { prevVal: prevItem, newVal: item });
	}
	updateItemsQuantity() {
		const { activeItems, completedItems } = this._items.reduce(
			(acc, item) => {
				item.completed ? acc.completedItems++ : acc.activeItems++;
				return acc;
			},
			{
				activeItems: 0,
				completedItems: 0,
			}
		);

		this._activeItemsQuantity = activeItems;
		this._completedItemsQuantity = completedItems;
		this._totalItemsQuantity = activeItems + completedItems;
	}

	onAdd(handler) {
		this._emitter.subscribe("event:add_item", handler);
	}
	onDelete(handler) {
		this._emitter.subscribe("event:remove_item", handler);
	}
	onChange(handler) {
		this._emitter.subscribe("event:update_item", handler);
	}
}
