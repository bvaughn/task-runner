module tr {

  /**
   * Invokes a callback function when run.
   *
   * <p>This type of Task can be asynchronous or asynchronous.
   * <ul>
   *  <li>
   *    Set <code>opt_synchronous</code> to TRUE for synchronous tasks.
   *    This type of task will automatically complete itself after the callback function is called.
   *    If an error occurs in the callback function, this type of task will error.
   *  <li>
   *    Set <code>opt_synchronous</code> to FALSE for asynchronous tasks.
   *    In this case the task not complete until specifically instructed to do so.
   *    To complete the task, your callback should call either complete() or error().
   * </ul>
   */
  export class Closure extends tr.Abstract {

    autoCompleteUponRun_:boolean;
    protected runImplFn_:(task:tr.Closure) => void;

    /**
     * Constructor.
     *
     * @param runImplFn The function to be executed when this Task is run.
     *                  ClosureTask will pass a reference to itself to the function.
     * @param synchronous This task should auto-complete when run.
     * @param name Optional task name.
     */
    constructor(runImplFn:(task:tr.Closure) => void, synchronous?:boolean, name?:string) {
      super(name || "Closure");

      this.runImplFn_ = runImplFn;
      this.autoCompleteUponRun_ = !!synchronous;
    }

    /** @override */
    protected runImpl():void {
      try {
        this.runImplFn_(this);

        // Don't auto-complete if the callback has already interrupted or completed this task.
        if (this.autoCompleteUponRun_ && this.getState() === tr.enums.State.RUNNING) {
          this.completeInternal();
        }

      } catch (error) {

        // Edge case that could be triggered if a Closure task invokes another synchronous task that errors.
        if (this.getState() === tr.enums.State.RUNNING) {
          this.errorInternal(error, error.message);
        }
      }
    }

    /**
     * Complete this task.
     *
     * @param data Task data to be later accessible via getData().
     */
    complete(data?:any):void {
      this.completeInternal(data);
    }

    /**
     * Error this task.
     *
     * @param data Error data to be later accessible via getData().
     * @param errorMessage Error message to be later accessible via getErrorMessage()
     */
    error(data?:any, errorMessage?:string):void {
      this.errorInternal(data, errorMessage);
    }
  }
}
