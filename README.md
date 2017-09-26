# queue-batch

A minimalistic queue processor which emits events.

# Example

```javascript
var Processor = require('queue-batch');

var longRunningFunction = (item, next) => {
    console.log('got a new item to process');
    console.log(item);
    setTimeout(next, 1000);
};

var processor = new Processor(longRunningFunction);
processor.on('error', (error) => {
    console.error('an error occured', error);
});
processor.on('empty', () => {
    console.log('queue exhausted');
});

processor.push('item');
processor.push('one', 'two');
processor.concat([1, 2, 3]);
```
Which will output
```bash
got a new item to process
item
got a new item to process
one
got a new item to process
two
got a new item to process
1
got a new item to process
2
got a new item to process
3
```
Then after a second or so
```bash
queue exhausted
```

# API

`new Processor(callback, concurrency = 10, queue = []);`

 * `callback: function(item, next: function(error))` is a required function which will be invoked for each item `push`ed or `concat`ed to the processor.
 * `currency: ?int` is an optional positive integer, decribing the number of concurrent items can be handled by the `callback`.
 * `queue: ?Array` is an optional array. If specified the items will automatically be added to the queue and the processor will start working.

Creates a new batch processor with a handler callback, optional concurrency limit and queue. The batch processor is an `EventEmitter` and will emit an `empty` even, when the queue has been completed. If at any point the callback function returns an error to the `next` callback option the `error` event will be emitted on the processor object.

`Processor.prototype.push(item1[, item2[, ...itemn]]);`

 * `item1 ... itemn` each argument provided will be push onto the queue. If the batch processor is not running at the concurrency limit the first item will immediately start getting processed.

`Processor.prototype.concat(array);`

 * `array' is an array of items to push onto the queue one after the other.

This has the same effect as `processor.push(array[0], ... , array[n]);` or `array.forEach((item) => processor.push(item));`

`Processor.prototype.on(eventName, handler);`

 * `eventName: 'error' | 'empty'` the event to which you wish to attach a handler
 * `handler: function` the desired handler function.

## Events

`error` - `processor.on('error', function (error) { });`

Emitted if an errors has been reported back via the processor `callback` function through the `next` callback.

```javascript
var errorCallback = (item, next) => {
    if (item === 2) { return next('2 is an exceptional number'); }
    next();
};
var processor = new Processor(errorCallback);
processor.on('error', (error) => {
    console.error(error); // outputs '2 is an exceptional number'
});
```

`empty` - `processor.on('empty', function () { });`

Emitted when the queue no longer contains any items.

