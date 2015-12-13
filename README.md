# object-track

Wrap an object to track property assignments and method calls made on the
wrapper directly. All such assignments and calls are forwarded to the
underlying object, and an array of all such assignments and calls can be
retrieved. This array can also be used to playback the same actions on a
different object.

# Example

If run in a browser

``` js
var canvas1 = document.createElement("canvas");
var context1 = canvas1.getContext("2d");

var Tracker = require("object-track");
var trackedContext = Tracker.track(context1);

trackedContext.strokeStyle = "#FF0000";
trackedContext.beginPath();
trackedContext.moveTo(5, 5);
trackedContext.lineTo(10, 10);
trackedContext.stroke();
// Draws a red diagonal line in context1.

var actions = Tracker.getActions(trackedContext); /* actions is [
{key: "strokeStyle", set: "#FF0000"},
{key: "beginPath", arguments: []},
{key: "moveTo", arguments: [5, 5]},
{key: "lineTo", arguments: [10, 10]},
{key: "stroke", arguments: []},
] */

var canvas2 = document.createElement("canvas");
var context2 = canvas2.getContext("2d");
Tracker.play(context2, actions);
// Draws a red diagonal line in context2.
```

# API

``` js
var Tracker = require("object-track");
```

## Tracker.track(object)

Returns a wrapper of the object that records all property assignments and
method calls before forwarding them. The tracked properties and methods include
those found by a `for-in` loop run on the object at the time this method was
called. Extensions to the object are not tracked; see the limitations section
for details.

## Tracker.getActions(tracker)

Pass a return of `Tracker.track`. Returns an array of objects representing all
property assignments and method calls made on the tracker.
- Property assignments are recorded with keys `key` and `set`, where `key` is a
  string naming the property assigned to and `set` is the value that was
  assigned.
- Method calls are recorded with keys `key` and `arguments`, where `key` is a
  string naming the method called and `arguments` is an array with all
  arguments passed (and not an array-like object).

Since all arrays are truey, the easiest way to distinguish between the two
kinds of actions is `if (action.arguments)`.

## Tracker.play(object, actions)

The second parameter should be a return of `Tracker.getActions` or any object
in that format. The appropriate property assignments and method calls are made
on the provided object in order. Returns the object.

# Install

With [npm](http://npmjs.org) installed, run

```
npm install object-track
```

# Test

With [npm](http://npmjs.org) installed, run

```
npm test
```

To lint with [ESLint](http://eslint.org/), run

```
npm run check
```

# Edge Cases and Limitations

tl;dr: Complex object interactions and dynamic objects are likely to break the
tracker. Tracking is best done on objects with no external relationships and a
fixed set of properties and methods, like a canvas context.

If a method call is made on the tracker with a context other than the tracker
itself, the call is assumed to operate on a different object and is not
recorded in the actions list. The call is forwarded as usual, however.

The tracker is intentionally shallow, and only calls made directly on it will
be tracked. If the wrapped object has methods that call its other methods,
those internal calls are not made on the tracker and will not be recorded.
Example:
``` js
var Tracker = require("object-track");
var obj = {
  method1: {},
  method2: {
    this.method1();
  },
};
var tracked = Tracker.track(obj);
tracked.method2();
console.log(Tracker.getActions(tracked));
// [{key: "method2", arguments: []}]
// Notice the call to method1 is not recorded.
```

The environment is assumed not to support proxies or object observation, so the
implementation uses nothing more complicated than `Object.defineProperty`, and
a `for-in` loop is used to detect properties and methods to track. The
consequences of this are
- nonenumerable properties and methods are not in the tracker, and interactions
  with them as though the original object was being used may fail.
- `delete object[key]` operations are not tracked and will result in that key
  no longer being tracked or forwarded.
- if the object's properties contain objects themselves, mutations or method
  calls on them will not be tracked.
- additions of new properties or methods to the tracked object are not tracked.
- additions of new properties or methods to the tracker will not be forwarded.

In theory, the nonenumerable properties issue could be fixed by using
`Object.getOwnPropertyNames` and a walk up the prototype chain. This may become
an option in a future version.

Finally, objects with a key `__TRACKING_DATA__` won't work correctly. (This key
is used internally by the tracker.)

# License

MIT
