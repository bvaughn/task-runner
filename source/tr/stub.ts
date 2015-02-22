module tr {

  /**
   * No-op task primarily useful for unit testing.
   *
   * <p>This type of task can also be useful in a composite when a default, no-op behavior is desired.
   * Simply replace the placeholder null task with one that does actual work.
   *
   * <p>This task can be configured to auto-complete when it is executed.
   * Otherwise it will not complete or error until specifically told to do so.
   */
  export class Stub extends tr.Closure {

    /**
     * Constructor.
     *
     * @param autoCompleteUponRun Task should auto-complete when run.
     * @param name Optional task name.
     */
    constructor(autoCompleteUponRun?:boolean, name?:string) {
      super(
        function() {
           // No-op
        }, autoCompleteUponRun, name || "Stub");
    }
  }
}
