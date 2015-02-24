module tr {

  /**
   * Abstract implementation of Task.
   *
   * <p>To create a Task extend this class and override runImpl(), interruptImpl(), and resetImpl().
   *
   * <p>Your Task should call completeInternal() or errorInternal() when it is done.
   */
  export class Abstract implements tr.Task {

    // Auto-incremented unique ID managed by AbstractTask.
    static UNIQUE_ID_COUNTER:number = 0;

    private creationContext_:string;
    private data_:any;
    private errorMessage_:string;
    private interruptingTask_:tr.Task;
    private logger_:(text:string) => void;
    private name_:string;
    private state_:tr.enums.State;
    private taskCallbackMap_:{[event:string]:Array<TaskCallback>};
    private uniqueID_:number;

    /**
     * Constructor.
     *
     * @param name Optional task name, useful for automated testing or debugging.
     *             Sub-classes should specify a default equal to the name of the class.
     */
    constructor(name?:string) {
      this.name_ = name;

      this.state_ = tr.enums.State.INITIALIZED;
      this.taskCallbackMap_ = {};
      this.uniqueID_ = Abstract.UNIQUE_ID_COUNTER++;

      // Store extra context when in debug mode.
      if (window["DEBUG"]) {
        var error = new Error("Constructor");

        if (error.hasOwnProperty("stack")) {
          var stack = error["stack"];

          this.creationContext_ =
            stack.replace(/^\s+at\s+/gm, '')
              .replace(/\s$/gm, '')
              .split("\n")
              .slice(2);
        }

        // In some browsers, console.log function will error if the receiver (this) is not the console.
        // In others (like Phantom JS) console.log.bind will itself cause an error.
        this.logger_ = console.log.hasOwnProperty("bind") ? console.log.bind(console) : console.log;
      } else {
        this.logger_ = function(text:string):void {};
      }
    }

    /**
     * Debug logger for tasks.
     *
     * <p>Messages are logged with task information (id and name) for debugging purposes.
     * These log messages are disabled in production builds.
     *
     * @param text String to log to the console (if in debug mode)
     */
    protected log(text:string):void {
      this.logger_(text + " :: " + this);
    }

    // Accessor methods ////////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    toString():string {
      return this.name_ + ' [id: ' + this.uniqueID_ + ']';
    }

    /** @inheritDoc */
    getCompletedOperationsCount():number {
      return this.state_ === tr.enums.State.COMPLETED ? 1 : 0;
    }

    /** @inheritDoc */
    getCreationContext():string {
      return this.creationContext_;
    }

    /** @inheritDoc */
    getData():any {
      return this.data_;
    }

    /** @inheritDoc */
    getErrorMessage():string {
      return this.errorMessage_;
    }

    /** @inheritDoc */
    getName():string {
      return this.name_;
    }

    /** @inheritDoc */
    getOperationsCount():number {
      return 1;
    }

    /** @inheritDoc */
    getState():tr.enums.State {
      return this.state_;
    }

    /** @inheritDoc */
    getUniqueID():number {
      return this.uniqueID_;
    }

    // Interface methods ///////////////////////////////////////////////////////////////////////////////////////////////

    /** @inheritDoc */
    completed(callback:(task:tr.Task) => void, scope?:any):tr.Task {
      return this.on(tr.enums.Event.COMPLETED, callback, scope);
    }

    /** @inheritDoc */
    errored(callback:(task:tr.Task) => void, scope?:any):tr.Task {
      return this.on(tr.enums.Event.ERRORED, callback, scope);
    }

    /** @inheritDoc */
    final(callback:(task:tr.Task) => void, scope?:any):tr.Task {
      return this.on(tr.enums.Event.FINAL, callback, scope);
    }

    /** @inheritDoc */
    interrupt():tr.Task {
      if (this.state_ != tr.enums.State.RUNNING) {
        throw Error("Cannot interrupt a task that is not running.");
      }

      this.log('Interrupting');

      this.state_ = tr.enums.State.INTERRUPTED;

      this.interruptImpl();

      this.executeCallbacks(tr.enums.Event.INTERRUPTED);

      return this;
    }

    /** @inheritDoc */
    interrupted(callback:(task:tr.Task) => void, scope?:Object):tr.Task {
      return this.on(tr.enums.Event.INTERRUPTED, callback, scope);
    }

    /** @inheritDoc */
    interruptFor(interruptingTask:tr.Task):tr.Task {
      this.log('Interrupting for ' + interruptingTask);

      this.interruptingTask_ = interruptingTask;
      this.interrupt();

      var that = this;

      interruptingTask.completed(
        function (task:tr.Task) {
          if (task == that.interruptingTask_) {
            that.interruptingTask_ = null;
            that.run();
          }
        }, this);
      interruptingTask.errored(
        function (task:tr.Task) {
          if (task == that.interruptingTask_) {
            that.interruptingTask_ = null;

            // TRICKY Tasks cannot error unless they're running
            that.state_ = tr.enums.State.RUNNING;

            that.errorInternal(task.getData(), task.getErrorMessage());
          }
        }, this);

      return this;
    }

    /** @inheritDoc */
    off(event:tr.enums.Event, callback:(task:tr.Task) => void, scope?:any):tr.Task {
      this.taskCallbackMap_[event] = this.taskCallbackMap_[event] || [];

      var taskCallbacks:Array<TaskCallback> = this.taskCallbackMap_[event];

      for (var i = 0, length = taskCallbacks.length; i < length; i++) {
        var taskCallback = taskCallbacks[i];

        if (taskCallback.matches(callback, scope)) {
          taskCallbacks.splice(i, 1);

          return this;
        }
      }

      return this;
    }

    /** @inheritDoc */
    on(event:tr.enums.Event, callback:(task:tr.Task) => void, scope?:any):tr.Task {
      this.taskCallbackMap_[event] = this.taskCallbackMap_[event] || [];

      var taskCallbacks:Array<TaskCallback> = this.taskCallbackMap_[event];

      for (var i = 0, length = taskCallbacks.length; i < length; i++) {
        var taskCallback = taskCallbacks[i];

        if (taskCallback.matches(callback, scope)) {
          return this;
        }
      }

      taskCallbacks.push(new TaskCallback(callback, scope));

      return this;
    }

    /** @inheritDoc */
    reset():tr.Task {
      if (this.state_ == tr.enums.State.RUNNING) {
        throw Error("Cannot reset a running task.");
      }

      this.log('Resetting');

      if (this.state_ != tr.enums.State.INITIALIZED) {
        this.data_ = undefined;
        this.errorMessage_ = undefined;
        this.state_ = tr.enums.State.INITIALIZED;

        this.resetImpl();
      }

      return this;
    }

    /** @inheritDoc */
    run():tr.Task {
      if (this.state_ == tr.enums.State.RUNNING) {
        throw Error("Cannot run a running task.");
      }

      this.log('Running');

      if (this.state_ != tr.enums.State.COMPLETED) {
        this.interruptingTask_ = null;
        this.data_ = undefined;
        this.errorMessage_ = undefined;
        this.state_ = tr.enums.State.RUNNING;

        this.executeCallbacks(tr.enums.Event.STARTED);

        this.runImpl();
      }

      return this;
    }

    /** @inheritDoc */
    started(callback:(task:tr.Task) => void, scope?:any):tr.Task {
      return this.on(tr.enums.Event.STARTED, callback, scope);
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Call this method to mark the task as complete.
     */
    protected completeInternal(data?:any):void {
      if (this.state_ !== tr.enums.State.RUNNING) {
        throw 'Cannot complete an inactive task.';
      }

      this.log('Internal complete');

      this.data_ = data;
      this.state_ = tr.enums.State.COMPLETED;

      this.executeCallbacks(tr.enums.Event.COMPLETED);
      this.executeCallbacks(tr.enums.Event.FINAL);
    }

    /**
     * Call this method to mark the task as errored.
     */
    protected errorInternal(data?:any, errorMessage?:string):void {
      if (this.state_ != tr.enums.State.RUNNING) {
        throw 'Cannot error an inactive task.';
      }

      this.log('Internal error');

      this.data_ = data;
      this.errorMessage_ = errorMessage;
      this.state_ = tr.enums.State.ERRORED;

      this.executeCallbacks(tr.enums.Event.ERRORED);
      this.executeCallbacks(tr.enums.Event.FINAL);
    }

    /**
     * Executes an array of callback functions with the current task as the only parameter.
     */
    protected executeCallbacks(event:tr.enums.Event):void {
      var taskCallbacks = this.taskCallbackMap_[event];

      if (taskCallbacks) {
        for (var i = 0, length = taskCallbacks.length; i < length; i++) {
          taskCallbacks[i].execute(this);
        }
      }
    }

    // Hook methods (to override) //////////////////////////////////////////////////////////////////////////////////////

    /**
     * This method is called each time a task is interrupted.
     */
    protected interruptImpl():void {
    }

    /**
     * This method is called each time a task is reset.
     * Override it to perform custom cleanup between task-runs.
     */
    protected resetImpl():void {
    }

    /**
     * This method is called each time a task is run.
     * Call completeInternal() or errorInternal() when the task is finished.
     */
    protected runImpl():void {
      throw Error("Required methods runImpl() not implemented.");
    }
  }

  /**
   * A TaskCallback contains a reference to a callback function and the scope it should be called with.
   * @private
   */
  class TaskCallback {
    callback_:(task:tr.Task) => void;
    scope_:Object;

    constructor(callback:(task:tr.Task) => void, scope?:Object) {
      this.callback_ = callback;
      this.scope_ = scope;
    }

    /**
     * Executes the callback function with the scope if it's available.
     */
    execute(task:tr.Task):void {
      if (this.scope_) {
        this.callback_.call(this.scope_, task);
      } else {
        this.callback_(task);
      }
    }

    /**
     * This object contains the specified callback and scope.
     */
    matches(callback:(task:tr.Task) => void, scope?:Object):Boolean {
      return this.callback_ === callback && this.scope_ === scope;
    }
  }
};