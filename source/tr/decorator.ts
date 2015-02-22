module tr {

  /**
   * Provides a mechanism for creating tasks via composition rather than inheritance.
   *
   * <p>This task-type decorates an Object ("decorated") that defines a 'run' method.
   * This method will be passed 3 parameters:
   *
   * <ol>
   *   <li>
   *     <strong>complete</strong>:
   *     A callback to be invoked upon successful completion of the task.
   *     This callback accepts a parameter: data.
   *   <li>
   *     <strong>error</strong>:
   *     A callback to be invoked upon task failure.
   *     This callback accepts 2 parameters: data and error-message.
   *   <li>
   *     <strong>task</strong>:
   *     A reference to the decorator.
   * </ol>
   *
   * <p>The decorated Object may also implement 'interrupt' and 'reset' methods, although they are not required.
   */
  export class Decorator extends tr.Abstract {

    private decorated_:any;

    /**
     * Constructor.
     *
     * @param decorated JavaScript object to decorate with task functionality.
     * @param name Optional task name.
     * @throws Error if required method "run" not implemented by "decorated".
     */
    constructor(decorated:tr.Task, name?:string) {
      super(name || "Decorator");

      this.decorated_ = decorated;

      if (!this.isFunction_("run")) {
        throw Error("Required method run() not implemented.");
      }
    }

    /**
     * Returns the decorated object.
     *
     * @return {Object}
     */
    getDecorated():void {
      return this.decorated_;
    }

    // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @override */
    protected runImpl():void {
      this.decorated_.run(
        this.complete_.bind(this),
        this.error_.bind(this));
    }

    /** @override */
    protected interruptImpl():void {
      if (this.isFunction_("interrupt")) {
        this.decorated_.interrupt();
      }
    }

    /** @override */
    protected resetImpl():void {
      if (this.isFunction_("reset")) {
        this.decorated_.reset();
      }
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Complete this task.
     *
     * @param data Task data to be later accessible via getData().
     */
    complete_(data):void {
      this.completeInternal(data);
    }

    /**
     * Error this task.
     *
     * @param data Error data to be later accessible via getData().
     * @param errorMessage Error message to be later accessible via getErrorMessage()
     */
    error_(data, errorMessage):void {
      this.errorInternal(data, errorMessage);
    }

    /**
     * Is the specified decorated property a function?
     * @param property Name of property on decorated object
     */
    private isFunction_(property):boolean {
      return this.decorated_.hasOwnProperty(property) && typeof this.decorated_[property] === "function";
    }
  }
};
