/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
declare module es6 {
  class Promise {
    constructor(executer:(resolve:(value:any) => void, reject:(value:any) => void) => void);

    then(
      resolved:(value:any) => void,
      rejected:(value:any) => void);
  }
}