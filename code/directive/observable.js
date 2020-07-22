class Observable {
  constructor(vm) {
    this.walk(vm);
  }
  walk(obj) {
    if (!obj || typeof obj !== "object") {
      return;
    }
    Object.keys(obj).forEach((key) => {
      this.defineReactive(obj, key, obj[key]);
    });
  }
  defineReactive(obj, key, val) {
    let self = this;
    let dep = new Dep();
    // console.log(vm, key)
    Object.defineProperty(obj, key, {
      get() {
        console.log("get");
        if (Dep.target) {
          dep.addDep(Dep.target);
        }
        return val;
      },
      set(newVal) {
        if (newVal === val) return;
        val = newVal;
        dep.notify();
        self.walk(newVal);
      },
    });
  }
}
