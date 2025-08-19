/**
 * 函数柯里化
 *
 * 就是多参转单参
 *
 * 原理：利用闭包存储依次传入的参数，判断参数个数和原函数一致的时候，返回原函数调用结果
 * */

function curry(fn) {
  // fn 是原函数

  return function curried(...args) {
    console.log('接受到的参数', ...args)
    // 判断参数个数
    console.log('接受到的参数个数 -', args.length, '原函数的参数个数 -', fn.length)
    if (args.length === fn.length) {
      return fn(...args)
    } else {
      // 参数个数不够，返回一个新函数接受新参数，然后跟之前接受的合并
      return function (...nextArgs) {
        return curried(...args, ...nextArgs)
      }
    }
  }
}

function add(a, b, c, d) {
  return a + b + c + d
}

console.log('not curried -', add(1, 2, 3, 4))

const curriedAdd = curry(add)

console.log('curried -', curriedAdd(1)(2)(3)(4))
