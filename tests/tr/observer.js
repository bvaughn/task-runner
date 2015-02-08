goog.provide('tr.Observer.test');
goog.setTestOnly('tr.Observer.test');

goog.require('tr.Composite');
goog.require('tr.Observer');
goog.require('tr.Stub');
goog.require('tr.enums.State');

describe('tr.Observer', function() {

  it('should fail immediately when fail-upon-first-error is true', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2], true);

    observerTask.run();
    task1.run();
    task2.run();

    var data = {};
    var message = 'foobar';
    task1.error(data, message);
    expect(observerTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(observerTask.getData()).toBe(data);
    expect(observerTask.getErrorMessage()).toBe(message);
  });

  it('should not fail until all tasks are completed when fail-upon-first-error is false', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2], false);

    observerTask.run();
    task1.run();
    task2.run();

    var data = {};
    var message = 'foobar';
    task1.error(data, message);
    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);

    task2.complete();
    expect(observerTask.getState()).toBe(tr.enums.State.ERRORED);
    expect(observerTask.getData()).toBeUndefined();
    expect(observerTask.getErrorMessage()).toBeUndefined();
  });

  it('should completing immediately when no observed task is present', function() {
    var observerTask = new tr.Observer();
    observerTask.run();
    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should immediately complete if all observed tasks have already completed', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2]);

    task1.run();
    task1.complete();
    task2.run();
    task2.complete();

    observerTask.run();
    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should not start any of the observed tasks', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2]);

    observerTask.run();
    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.INITIALIZED);
    expect(task2.getState()).toBe(tr.enums.State.INITIALIZED);
  });

  it('should allow new tasks to be added while running', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1]);

    observerTask.run();
    task1.run();
    task2.run();
    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);

    observerTask.observe(task2);

    task1.complete();
    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);

    task2.complete();
    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task2.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should allow tasks to be removed while running', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2]);

    observerTask.run();
    task1.run();
    task2.run();

    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);

    observerTask.stopObserving(task2);

    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.RUNNING);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);

    task1.complete();

    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should complete if a task is removed leaving no more running tasks', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2]);

    observerTask.run();
    task1.run();
    task2.run();
    task1.complete();

    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);
    expect(task1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);

    observerTask.stopObserving(task2);

    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task1.getState()).toBe(tr.enums.State.COMPLETED);
    expect(task2.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should not observing duplicate tasks.', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task1]);

    expect(observerTask.getObservedTasks().length).toBe(1);

    observerTask.observe(task2);
    observerTask.observe(task1);
    observerTask.observe(task2);

    expect(observerTask.getObservedTasks().length).toBe(2);
  });

  it('should report the correct number of completed operations', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2]);

    observerTask.run();
    task1.run();
    task2.run();

    expect(observerTask.getOperationsCount()).toBe(2);
    expect(observerTask.getCompletedOperationsCount()).toBe(0);

    task1.complete();
    expect(observerTask.getCompletedOperationsCount()).toBe(1);

    var task3 = new tr.Stub();
    var task4 = new tr.Stub();
    var task5 = new tr.Composite(true, [task3, task4]);
    task5.run();

    observerTask.observe(task5);
    expect(observerTask.getOperationsCount()).toBe(4);
    expect(observerTask.getCompletedOperationsCount()).toBe(1);

    task3.complete();
    expect(observerTask.getCompletedOperationsCount()).toBe(2);

    task2.complete();
    task4.complete();
    expect(observerTask.getCompletedOperationsCount()).toBe(4);
    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
  });

  it('should be re-runnable after an error', function() {
    var task1 = new tr.Stub();
    var task2 = new tr.Stub();
    var observerTask = new tr.Observer([task1, task2], true);

    observerTask.run();
    task1.run();
    task2.run();
    task1.error();

    expect(observerTask.getState()).toBe(tr.enums.State.ERRORED);

    task1.run();
    task1.complete();
    observerTask.run();
    expect(observerTask.getState()).toBe(tr.enums.State.RUNNING);

    task2.complete();
    expect(observerTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});
