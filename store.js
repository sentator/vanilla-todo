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
	emit(eventName, ...args) {
		const event = this.events[eventName];
		event && event.forEach((callback) => callback.call(null, ...args));
	}
}

class Store {
	constructor(initialState = []) {
		this._items = initialState;
		this._emitter = new EventEmitter();
	}

	add(item) {
		this._items = [...this._items, item];
		this._emitter.emit("event:add_item", item);
		this._emitter.emit("event:state_change", [...this._items]);
	}
	remove(filterCallback) {
		const oldItems = [...this._items];
		this._items = this._items.filter(filterCallback);
		const deletedItems = oldItems.filter((item) => !this._items.includes(item));

		this._emitter.emit("event:remove_item", deletedItems);
		this._emitter.emit("event:state_change", [...this._items]);
	}
	update(updatedItems) {
		const updatedItemsObj = updatedItems.reduce((acc, item) => {
			acc[item.id] = item;
			return acc;
		}, {});
		this._items = this._items.map((item) => {
			const updatedItem = updatedItemsObj[item.id];

			return updatedItem ? updatedItem : item;
		});

		this._emitter.emit("event:update_item", updatedItems);
		this._emitter.emit("event:state_change", [...this._items]);
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
	onStateChange(handler) {
		this._emitter.subscribe("event:state_change", handler);
	}
}
