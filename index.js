// A key with tracking info that objects sent to this module are unlikely
// to have already.
var trackingKeyName = "__TRACKING_DATA__";

exports.track = function (object) {
  if (!object || typeof object !== "object") {
    throw new Error("track: Can only track objects.");
  }

  var tracker = {};
  // Attach tracking metadata to obscurely named nonenumerable property to
  // avoid differences in behavior between the tracker and wrapped object.
  Object.defineProperty(tracker, trackingKeyName, {
    value: {
      object: object,
      actions: [],
    },
  });

  // Set up the tracking and forwarding.
  var existing = inspectObject(object);
  addProps(tracker, existing.propList);
  addMethods(tracker, existing.methodList);

  return tracker;
};

exports.getActions = function (tracker) {
  if (!tracker || typeof tracker !== "object" || !tracker[trackingKeyName]) {
    throw new Error("getActions: Must pass valid tracker.");
  }

  return tracker[trackingKeyName].actions;
};

exports.play = function (object, actions) {
  if (!object || typeof object !== "object") {
    throw new Error("play: Can only play actions on objects.");
  } else if (!actions || typeof actions !== "object" || !actions.forEach) {
    throw new Error("play: Must pass array of actions.");
  }

  actions.forEach(function (action) {
    if (action.arguments) {
      object[action.key].apply(object, action.arguments);
    } else {
      object[action.key] = action.set;
    }
  });

  return object;
};

// Add assignable properties for tracking.
var addProps = function (tracker, propList) {
  var trackingData = tracker[trackingKeyName];
  propList.forEach(function (name) {
    Object.defineProperty(tracker, name, {
      enumerable: true,
      configurable: true,
      get: function () {
        return trackingData.object[name];
      },
      set: function (x) {
        trackingData.actions.push({
          key: name,
          set: x,
        });
        trackingData.object[name] = x;
      },
    });
  });
};

// Add callable methods for tracking.
var addMethods = function (tracker, methodList) {
  var trackingData = tracker[trackingKeyName];
  methodList.forEach(function (name) {
    tracker[name] = function () {
      var context = this;
      var argsArray = Array.prototype.slice.call(arguments);
      // Only record actions called directly on the tracker.
      if (this === tracker) {
        // Forwarded call should operate on original object.
        context = trackingData.object;
        trackingData.actions.push({
          key: name,
          arguments: argsArray,
        });
      }
      return trackingData.object[name].apply(context, argsArray);
    };
  });
};

// Find all existing properties and methods in the object.
var inspectObject = function (object) {
  var propList = [];
  var methodList = [];
  for (var k in object) {
    if (typeof object[k] === "function") {
      methodList.push(k);
    } else {
      propList.push(k);
    }
  }
  return {
    propList: propList,
    methodList: methodList,
  };
};
