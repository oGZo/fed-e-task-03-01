class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.cb = cb;
    this.key = key;
    Dep.target = this;
    this.oldValue = vm[key];
    Dep.target = null;
  }
  update() {
    let newValue = vm[this.key];
    if (newValue !== this.oldValue) {
      this.cb(newValue);
      this.oldValue = newValue;
    }
  }
}
