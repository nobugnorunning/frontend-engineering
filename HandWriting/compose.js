/**
 * 函数组合
 *
 * 就是把处理数据的函数像管道一样连接起来，让数据经过这些管道之后得到最终的结果
 * */

function compose(list) {
  // 接受list数组，由函数组成
  // compose也需要返回一个函数

  // 管道式的函数是将上一个函数的结果作为下一个函数的入参进行操作，得到最终的结果，所以使用 reduce

  // 取出第一个函数作为初始值
  const initialValue = list.shift();

  // 返回一个函数
  return function (...args) {

    // 因为包装了promise， 所以reduce最后的结果是一个promise，返回出去供外部调用then函数拿结果
    return list.reduce((pre, cur) => {

      // 包装后的pre是一个promise，通过then函数取结果
      return pre.then(res => {

        // 下一个操作也是函数
        /**
         cur 可以不用包裹promise，因为操作函数可能是同步函数，也可能是异步函数
         如果是同步函数可以直接调用，返回结果
         如果是异步函数，返回的结果也是个promise，同样可以return出去，如果在这里包裹promise，那他本身也是promise的话，就重复了
         *  */
        // 上一个函数的操作结果(res)是下一个函数(cur)的参数
        return cur.call(null, res)
      })
    }, Promise.resolve(initialValue.apply(null, args)));
  };
}

const cps = compose([
  res => res + 1,
  res => res + 2,
  res => res + 3
])

cps(0).then(result => {
  console.log(result)
})

const psCps = compose([
  res => new Promise(resolve => setTimeout(() => resolve(res + 1), 500)),
  res => new Promise(resolve => setTimeout(() => resolve(res + 2), 500)),
  res => new Promise(resolve => setTimeout(() => resolve(res + 3), 500))
])

psCps(0).then(result => {
  console.log(result)
})