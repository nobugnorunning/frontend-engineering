const a = 1

const b = 2

class Study {
  constructor() {
    this.a = a
    this.b = b
  }

  getSum() {
    return this.a + this.b
  }

  getProduct() {
    return this.a * this.b
  }
}

const study = new Study()
console.log('Sum:', study.getSum())
console.log('Product:', study.getProduct())
// This code snippet is a simple demonstration of a class in JavaScript
// that calculates the sum and product of two numbers.
// It defines a class `Study` with a constructor that initializes two properties `a` and `b`.
// The class has two methods: `getSum` which returns the sum of `a` and `b`,
// and `getProduct` which returns the product of `a` and `b`.
// The code then creates an instance of the `Study` class and logs the results of the sum and product calculations to the console.

// 往文档里添加一些节点，以触发 MutationObserver
window.onload = function (){
  let i = 0;
  let nodes = []
  for (const arrayElement of new Array(50)) {
    const div = document.createElement('div')
    i++
    div.innerHTML = `这是第 ${i} 个节点`
    nodes.push(div)
  }

  nodes.map(node => {
    document.body.appendChild(node)
  })
}