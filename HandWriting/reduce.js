Array.prototype.Reduce_Copy = function (callbackFn, initialValue) {
  let pre, index;
  let arr = this.slice();
  /** 判断初始值，取第一个元素 */
  if (!initialValue) {
    for (let i = 0; i < arr.length; i++) {
      if (i in arr) {
        pre = arr[i];
        index = i + 1;
        break;
      }
    }
  } else {
    pre = initialValue;
    index = 0;
  }

  // 真正累加的操作，从 index 开始，在设置 initialValue 的时候设置了 pre 是第一个元素，所以 index 不一定从 0 开始
  for (let i = index; i < arr.length; i++) {
    if (i in arr) {
      pre = callbackFn.call(null, pre, arr[i], i, this);
    }
  }

  return pre;
};

const a = [, , , 1, 2, 3, 4, 5];

const sum = a.Reduce_Copy((a, b) => a + b);

console.log('sum a =', sum)

/**
 * 稀疏数组： 类似这样 [<empty x 5>, 1]
 * 空的地方代表没有被分配内存空间，数组的一些遍历方法会自动跳过这些地方，但是for循环不会
 *
 * [<empty x 5>, 1]  和 [undefined, undefined, 1] 不同，前者是稀疏数组，后者虽然值是undefined，但是该位置是有值的，只不过值就是undefined
 * */
