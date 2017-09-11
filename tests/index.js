/* @flow */

var test = require('tape');
var Processor = require('../');
var EventEmitter = require('events');

var noop = function noop(cb) {cb()};

test('Processor extends EventEmitter', (t) => {
    t.plan(1);

    var processor = new Processor(noop);

    t.ok((processor instanceof EventEmitter), 'Correct inheritance');
});

test('Processor works', (t) => {
    t.plan(4);

    var testItem = 'hello, world';
    var testArray = [testItem, testItem, testItem];

    var testCallback = (item, cb) => {
        t.equal(item, testItem, 'Correct item');
        cb();
    };

    var processor = new Processor(testCallback, 1, testArray);
    processor.on('empty', t.end);
    processor.on('error', t.fail);

    t.equal(processor.concurrency, 1, 'correct concurrency');
});

test('Processor push', (t) => {
    t.plan(4);

    var testItem = 'hello, world';

    var testCallback = (item, cb) => {
        t.equal(item, testItem, 'Correct item');
        cb();
    };

    var processor = new Processor(testCallback, 1);
    processor.on('empty', t.end);
    processor.on('error', t.fail);

    processor.push(testItem);
    processor.push(testItem, testItem);

    t.equal(processor.concurrency, 1, 'correct concurrency');
})

test('Processor concat', (t) => {
    t.plan(4);

    var testItem = 'hello, world';
    var testArray = [testItem, testItem, testItem];

    var testCallback = (item, cb) => {
        t.equal(item, testItem, 'Correct item');
        cb();
    };

    var processor = new Processor(testCallback, 1);
    processor.on('empty', t.end);
    processor.on('error', t.fail);

    processor.concat(testArray);

    t.equal(processor.concurrency, 1, 'correct concurrency');
});

test('Concurrency', (t) => {
    t.plan(6);

    var testItem = 'hello, world';
    var testArray = [testItem, testItem, testItem];

    var testDateLower = new Date();
    var testDateUpper = new Date(testDateLower);
    var timeoutValue = 100;

    var testCallback = (item, cb) => {
        t.equal(item, testItem, 'Correct item');
        setTimeout(cb, timeoutValue);
    };

    var secondsEpsilon = 50.0;
    var processor = new Processor(testCallback);
    processor.on('empty', () => {
        var now = new Date();
        testDateLower.setMilliseconds(testDateLower.getMilliseconds() + timeoutValue);
        testDateUpper.setMilliseconds(testDateUpper.getMilliseconds() + timeoutValue + secondsEpsilon);
        t.ok(now.getTime() >= testDateLower.getTime());
        t.ok(now.getTime() <= testDateUpper.getTime());
        t.end();
    });
    processor.on('error', t.fail);

    processor.concat(testArray);

    t.equal(processor.concurrency, 10, 'correct concurrency');
});

test('Concurrency 2', (t) => {
    t.plan(9);

    var testItem = 'hello, world';
    var testArray = [testItem, testItem, testItem];

    var testDateLower = new Date();
    var testDateUpper = new Date(testDateLower);
    var timeoutValue = 100.0

    var testCallback = (item, cb) => {
        t.equal(item, testItem, 'Correct item');
        setTimeout(cb, timeoutValue);
    };

    var secondsEpsilon = 50.0;
    var processor = new Processor(testCallback, 2);
    processor.on('empty', () => {
        var now = new Date();
        testDateLower.setMilliseconds(testDateLower.getMilliseconds() + 3*timeoutValue);
        testDateUpper.setMilliseconds(testDateUpper.getMilliseconds() + 3*timeoutValue + secondsEpsilon);
        t.ok(now.getTime() >= testDateLower.getTime());
        t.ok(now.getTime() <= testDateUpper.getTime());
        t.end();
    });
    processor.on('error', t.fail);

    processor.concat(testArray);
    processor.concat(testArray);

    t.equal(processor.concurrency, 2, 'correct concurrency');
});

test('handle error from concurrent function', (t) => {
    t.plan(11);

    var testItem = 'hello, world';
    var testArray = [testItem, 1, testItem];
    var testError = 'error';

    var testDateLower = new Date();
    var testDateUpper = new Date(testDateLower);
    var timeoutValue = 100.0

    var testCallback = (item, cb) => {
        if (item === 1) {
            t.equal(item, 1, 'Correct item');
            return setTimeout(() => cb(testError), timeoutValue);
        }
        t.equal(item, testItem, 'Correct item');
        setTimeout(cb, timeoutValue);
    };

    var secondsEpsilon = 50.0;
    var processor = new Processor(testCallback, 2);
    processor.on('empty', () => {
        var now = new Date();
        testDateLower.setMilliseconds(testDateLower.getMilliseconds() + 3*timeoutValue);
        testDateUpper.setMilliseconds(testDateUpper.getMilliseconds() + 3*timeoutValue + secondsEpsilon);
        t.ok(now.getTime() >= testDateLower.getTime());
        t.ok(now.getTime() <= testDateUpper.getTime());
        t.end();
    });
    processor.on('error', (error) => {
        t.equal(error, testError, 'correct error');
    });

    processor.concat(testArray);
    processor.concat(testArray);

    t.equal(processor.concurrency, 2, 'correct concurrency');
});
