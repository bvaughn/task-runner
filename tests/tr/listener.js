describe('tr.Listener', function() {

  var eventTarget;
  var eventType = 'click';
  var waitForEventTask;

  beforeEach(function() {
    eventTarget = document.createElement("div");

    waitForEventTask = new tr.Listener(eventTarget, eventType);
  });

  var dispatchEventType = function(type) {
    var event = document.createEvent('Event');
    event.initEvent(type, true, true);

    eventTarget.dispatchEvent(event);
  };

  it('should complete when an event of the correct type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);

    dispatchEventType(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(waitForEventTask.getData()).toBeTruthy();
  });

  it('should not complete when an event of the incorrect type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);

    dispatchEventType('incorrect-type');

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should only complete once even if multiple matching events are dispatched', function() {
    waitForEventTask.run();

    dispatchEventType(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);

    dispatchEventType(eventType); // Will error if task tries to complete again
  });

  it('should not complete when an event is dispatched before running', function() {
    dispatchEventType(eventType);

    waitForEventTask.run();
    
    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should not complete when an event is dispatched while interrupted', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    dispatchEventType(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reattach listener when rerun after an interruption', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    waitForEventTask.run();

    dispatchEventType(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});