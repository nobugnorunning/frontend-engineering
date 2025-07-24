Array.prototype.Map_Copy = function(callbackFn, thisArg) {
  const ret = new Array(this.length);
  let callThis;

  if (thisArg === null || thisArg === undefined) {
    // 文件用node运行，没有window，用globalThis代替
    callThis = globalThis || window;
  }

  const arr = this.slice();
  for (let i = 0; i < arr.length; i++) {
    if (i in arr) {
      ret[i] = callbackFn.call(callThis, arr[i], i, arr);
    }
  }

  return ret
}

const a = [1, 2, 3, 4, 5]

console.log(a.Map_Copy(item => item * 2))
