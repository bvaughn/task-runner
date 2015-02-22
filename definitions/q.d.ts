/**
 * Definition file for Q promises.
 * @see https://github.com/kriskowal/q
 */
declare module Q {

  function defer():Deferred;

  class Deferred {
    promise:Promise;
    resolve(value:any):void;
    reject(reason:any):void;
  }

  class Promise {
    then(
      resolved:(value:any) => void,
      rejected:(reason:any) => void,
      lastly?:(value:any) => void):void;
  }
}