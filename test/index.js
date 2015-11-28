/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions */

var expect = require("chai").expect;
var Tracker = require("../index.js");

describe("object-track", function () {
  var testObject;

  beforeEach(function () {
    testObject = {
      prop1: 1,
      prop2: "a",
      method1: function (n) {
        this.prop1 += n;
      },
      method2: function (s) {
        this.prop2 += s;
      },
    };
  });

  it("should track assignments and forward them", function () {
    var tracked = Tracker.track(testObject);
    tracked.prop1 = 2;
    tracked.prop2 = "b";
    tracked.prop1 = 3;
    expect(testObject.prop1).to.equal(3);
    expect(testObject.prop2).to.equal("b");
    expect(Tracker.getActions(tracked)).to.deep.equal([
      {key: "prop1", set: 2},
      {key: "prop2", set: "b"},
      {key: "prop1", set: 3},
    ]);
  });

  it("should track method calls and forward them", function () {
    var tracked = Tracker.track(testObject);
    tracked.method1(1);
    tracked.method2("bc");
    tracked.method1(2, 3, 4);
    expect(testObject.prop1).to.equal(4);
    expect(testObject.prop2).to.equal("abc");
    expect(Tracker.getActions(tracked)).to.deep.equal([
      {key: "method1", arguments: [1]},
      {key: "method2", arguments: ["bc"]},
      {key: "method1", arguments: [2, 3, 4]},
    ]);
  });

  it("should report correct values for the object's properties", function () {
    var tracked = Tracker.track(testObject);
    tracked.prop1 = 2;
    expect(tracked.prop1).to.equal(2);
    testObject.prop1 = 3;
    expect(tracked.prop1).to.equal(3);
    testObject.method1(1);
    expect(tracked.prop1).to.equal(4);
  });

  it("should not track method calls with a different context", function () {
    var tracked = Tracker.track(testObject);
    tracked.method1.apply({}, [1]);
    expect(Tracker.getActions(tracked)).to.deep.equal([]);
  });

  it("should play back action lists correctly", function () {
    Tracker.play(testObject, [
      {key: "prop1", set: 2},
      {key: "prop2", set: "b"},
    ]);
    expect(testObject.prop1).to.equal(2);
    expect(testObject.prop2).to.equal("b");

    Tracker.play(testObject, [
      {key: "method1", arguments: [3]},
      {key: "method2", arguments: ["cd"]},
    ]);
    expect(testObject.prop1).to.equal(5);
    expect(testObject.prop2).to.equal("bcd");
  });
});
