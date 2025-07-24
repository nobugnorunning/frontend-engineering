Array.prototype.Some_Copy = function(callbackFn) {
  let result = false;

  for (let i = 0; i < this.length; i++) {
    if (callbackFn(this[i])) {
      result = true;
      break
    }
  }

  return result
}

const a = [1, 2, 3, 4, 5]

console.log(a.Some_Copy((item) => item < 0))
console.log(a.Some_Copy((item) => item === 1))
