class Core {
  queue = [];

  constructor() {}

  push(task) {
    this.queue.push(task);
  }

  middleware(queueItem) {
    return queueItem
  }

  map() {
    return this.queue.map(item => {
      return this.middleware(item)
    })
  }
}

const core = new Core();

core.push(() => {
  console.log('Task 1 executed');
})

const list = core.map()

console.log(list)