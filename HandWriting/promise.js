/**
 * new Promise((resolve, reject) => {})
 *
 * promise 有三个状态，并且不可逆，pending, fulfilled, rejected
 * 参数是个函数，并且接收 resolve ，reject 两个参数，这两个参数也是函数
 * resolve的参数是值，reject的参数是错误信息等
 *
 * then也有两个参数，一个是resolveCallback(onFulfilled)，一个是rejectCallback(onRejected)
 * then要实现链式调用，所以返回的也应该是个 promise
 * */

export class Promise {
  constructor(fn) {
    if (!fn || typeof fn !== "function") {
      throw new Error();
    }

    this.resolveTasks = [];

    this.rejectTasks = [];

    this.state = "pending";

    const resolve = value => {
      if (this.state !== "pending") {
        return;
      }

      this.state = "fulfilled";

      this.data = value;

      setTimeout(() => {
        this.resolveTasks.forEach(cb => cb(value));
      });
    };

    const reject = err => {
      if (this.state !== "pending") {
        return;
      }

      this.state = "rejected";

      this.error = err;

      setTimeout(() => {
        this.rejectTasks.forEach(cb => cb(err));
      });
    };

    // 执行
    try {
      fn(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // then 函数的resolveCallback 实际上就是用来取值的函数
  then(resolveCallback, rejectCallback) {
    const onFulfilled = typeof resolveCallback === "function" ? resolveCallback : value => value;
    const onRejected = typeof rejectCallback === "function" ? rejectCallback : reason => {
      throw reason;
    };

    // then 函数返回一个promise，实现链式调用
    const p = new Promise((resolve, reject) => {

      // 返回的promise里面不能直接执行回调，要等 resolve 被调用的时候再执行，所以先推入执行栈
      this.resolveTasks.push(() => {
        // then 函数的回调中，有可能会继续返回一个promise
        const res = onFulfilled(this.data);

        this._resolvePromise(p, res, resolve, reject);
      });

      this.rejectTasks.push(() => {
        const res = onRejected(this.error);

        this._resolvePromise(p, res, resolve, reject);
      });
    });

    return p
  }

  _resolvePromise(promise, value, resolve, reject) {
    if (promise === value) {
      return reject(new Error("chain circle"));
    }

    let called = false;
    // 返回值是一个 promise
    if (value instanceof Promise) {
      value.then(res => {
        if (called) return;
        called = true;
        this._resolvePromise(promise, res, resolve, reject);
      }, error => {
        if (called) return;
        called = true;
        reject(error);
      });
    } else if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      // 如果 value 是个对象，并且有 then 函数，视作 promise
      const then = value.then

      if (typeof then === 'function') {
        then.call(
          value,
          v => {
            if (called) return;
            called = true;
            this._resolvePromise(promise, v, resolve, reject)
          },
          e => {
            if (called) return;
            called = true;
            reject(e)
          }
        )
      } else {
        resolve(value);
      }
    } else {
      resolve(value);
    }
  }

  catch(catchCallback) {
    return this.then(undefined, catchCallback);
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (const promise of promises) {
        if (promise instanceof Promise) {
          promise.then(resolve);
        } else {
          new Promise((resolve, reject) => {
            resolve(promise);
          });
        }
      }
    });
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      const result = [];
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i];
        let p = promise;
        if (!(promise instanceof Promise)) {
          p = new Promise((resolve, reject) => {
            resolve(promise);
          });
        }

        p.then((res) => {
          result[i] = res;

          if (result.length === promises.length) {
            resolve(result);
          }
        });
      }
    });
  }
}