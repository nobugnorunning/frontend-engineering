let activeEffect = null
let effectMap = new WeakMap()
/**
 * 为什么要用 WeakMap
 * -- 因为要收集依赖的对象可能是个非字符串类型的键，比如Dom节点，Object等等，WeakMap支持引用数据类型作为键使用
 * */

export function reactive(state) {
  return new Proxy(state, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)

      const value = Reflect.get(target, key, receiver)

      // reactive 主要针对对象和数组
      if ((typeof value === 'object' && value !== null) || Array.isArray(value)) {
        return reactive(value)
      }

      return value;
    },
    set(target, key, val) {
      const result = Reflect.set(target, key, val);
      trigger(target, key);
      return result;
    }
  });
}

//  依赖收集
function track(target, key) {
  if (!activeEffect) {
    return
  }

  // 找到某个目标收集到的依赖
  let depsMap = effectMap.get(target)

  if (!depsMap) {
    depsMap = new Map()
    effectMap.set(target, depsMap)
  }

  // 跟这个键相关的所有依赖
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  deps.add(activeEffect)
}

// 触发更新
function trigger(target, key) {
  const depsMap = effectMap.get(target)

  if (!depsMap) {
    return
  }

  const deps = depsMap.get(key)

  if (deps) {
    deps.forEach(effect => effect())
  }
}

function recursionGet(value, gets = new Set()) {
  if (typeof value === 'object' && value !== null) {
    gets.add(value)

    for (const key in value) {
      recursionGet(value[key], gets)
    }
  }
  return value
}

// 监听
export function watch(source, handler, options = {}) {
  const { deep = false } = options

  let oldValue;

  let getter = source

  if (typeof source !== "function") {
    getter = () => source
  }

  // 深监听就是触发一遍内部所有属性的get，完成依赖收集
  if (deep) {
    // 这里不创建一个副本的话，会导致死循环
    const _getter = getter
    getter = () => recursionGet(_getter())
  }
  
  activeEffect = () => {
    const newValue = getter()
    
    // 这里比较两个值，可以通过options设置
    // 比如设置深监听，其实就是判断的方法不一样
    if (newValue !== oldValue || deep) {
      handler(newValue, oldValue)

      oldValue = newValue
    }
  }

  /**
   * getter() 调用，触发了 get函数，get函数中进行依赖收集，effect函数被收集起来
   * */
  oldValue = getter()
  activeEffect = null
}