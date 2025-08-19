export const isPromise = (target) => {
  return target instanceof Promise;
};

// 异步并发任务
export class ConcurrentTask {
  constructor(max = 2) {
    this.init();
    this.max = max;
  }

  init() {
    this.tasks = [];
    // 异步任务执行的结果集
    this.result = [];
    this.errors = {};
    this.index = 0;
    this.running = 0;
  }

  push(task) {
    this.tasks.push(task);
  }

  remove() {
    this.tasks.shift();
  }

  clear() {
    this.init();
  }

  validTask(task) {
    return typeof task === 'function';
  }

  hasRunningTask() {
    return this.running !== 0;
  }

  overMax() {
    return this.running >= this.max;
  }

  taskOver() {
    return this.index >= this.tasks.length;
  }

  size() {
    return this.tasks.length;
  }

  run() {
    return new Promise((resolve) => {
      const next = () => {
        if (this.taskOver() && !this.hasRunningTask()) {
          resolve({
            success: this.result,
            errors: this.errors,
          });
          return;
        }

        while (!this.overMax() && !this.taskOver()) {
          const taskIndex = this.index++;
          const task = this.tasks[taskIndex];

          this.running++;

          if (this.validTask(task)) {
            const ret = task();
            if (isPromise(ret)) {
              ret
                .then((res) => {
                  this.result[taskIndex] = res;
                })
                .catch((err) => {
                  this.errors[taskIndex] = err;
                })
                .finally(() => {
                  this.running--;
                  next();
                });
            } else {
              this.errors[taskIndex] =
                "task should be a function return promise";
              this.running--;
              next();
            }
          } else {
            this.errors[taskIndex] = "task should be a function return promise";
            this.running--;
            next();
          }
        }
      };
      next();
    });
  }
}
