/* @flow */
var EventEmitter = require('events');

function Processor(callback/*: function */, concurrency/*: number */ = 10, queue/*: Array<mixed> */ = []) {
    this.next = next.bind(this);
    this.push = push.bind(this);
    this.concat = concat.bind(this);
    this.invoke = invoke.bind(this);

    this.callback = callback;
    this.concurrency = concurrency <= 0 ? 10: concurrency;
    this.running = 0;
    this.queue = queue;
    setImmediate(() => {
        while (this.running < this.concurrency && this.queue.length) {
            this.running++;
            this.next();
        }
    });
    return this;
}
Processor.prototype = Object.create(EventEmitter.prototype);

function push(...items) {
    this.concat(items);
}

function concat(items/* Array<mixed> */) {
    this.queue.push(...items);
    while (this.running < this.concurrency && this.queue.length) {
        this.running++;
        this.next();
    }
}

function invoke() {
    if (this.queue.length) {
        this.callback(this.queue.shift(), this.next);
    } else {
        this.next();
    }
}

function next(err/*: ?mixed */) {
    if (err) {
        this.emit('error', err);
    }
    if (this.queue.length) {
        setImmediate(this.invoke);
    } else {
        this.running--;
        if (!this.running) {
            this.emit('empty');
        }
    }
}

module.exports = Processor;
