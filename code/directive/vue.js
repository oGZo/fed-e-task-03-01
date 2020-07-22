class Vue {
  constructor(options) {
    this._proxy(options);
    new Observable(options.data);
    this.compile(options.el);
  }
  // 将methods绑定到 this  代理data数据到 this上
  _proxy(options) {
    let { data = {}, methods = {} } = options;
    Object.keys(methods).forEach((key) => {
      this.key = methods[key].bind(this);
    });
    Object.keys(data).forEach((key) => {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(val) {
          data[key] = val;
        },
      });
    });
  }
  // 编译组件
  compile(el) {
    if (!(el instanceof Element)) {
      el = document.querySelector(el);
    }
    if (!el) return;
    Array.from(el.childNodes).forEach((node) => {
      if (this.isTextNode(node)) {
        this.compileText(node);
      } else if (this.isElement(node)) {
        this.compileElement(node);
        if (node.childNodes.length) {
          this.compile(node);
        }
      }
    });
  }
  // text指令
  textUpdater(el, key, value) {
    el.textContent = value || "";
    new Watcher(this, key, (newValue) => {
      el.textContent = newValue;
    });
  }
  // html指令
  htmlUpdater(el, key, value) {
    el.innerHTML = value || "";
    new Watcher(this, key, (newValue) => {
      el.innerHTML = newValue;
    });
  }
  // 双向绑定指令支持
  modelUpdater(el, key, value) {
    if (el.value == value) {
      return;
    }
    el.value = value;
    // el.setAttribute(key, value);
    el.addEventListener("input", () => {
      console.log(1111, key, el.value);
      this[key] = el.value;
    });
    new Watcher(this, key, (newValue) => {
      console.log("newValue", newValue);
      if (el.value != newValue) {
        el.value = newValue;
      }
    });
  }
  // 事件处理
  eventHandler(el, key, value) {
    if (!value || !value.trim()) return;
    value = value.trim();
    el.addEventListener(key, (e) => {
      let fn = this[value];
      fn.call(this, e);
    });
  }
  // 编译文本
  compileText(el) {
    let reg = /{{(.*)}}/;
    if (reg.test(el.textContent)) {
      let key = RegExp.$1.trim();
      let value = this[key];
      el.textContent = value;
      console.log(9991111, key);
      new Watcher(this, key, (newValue) => {
        console.log(9991111, key, newValue);
        el.textContent = newValue;
      });
    }
  }
  // 编译元素节点
  compileElement(el) {
    let attrs = el.attributes;
    Array.from(attrs).forEach((a) => {
      let attr = a.name;
      let val = a.value;
      if (this.isDirective(attr)) {
        let key = attr.slice(2);
        let value = this[val];
        let fn = this[key + "Updater"];
        fn && fn.call(this, el, val, value);
        if (attr.startsWith("v-on")) {
          this.eventHandler(el, attr.slice(5), val);
        }
      }
    });
  }
  // 是否指令
  isDirective(attr) {
    return attr.startsWith("v-");
  }
  // 是否文本节点
  isTextNode(el) {
    return el.nodeType === 3;
  }
  // 是否元素节点
  isElement(el) {
    return el.nodeType === 1;
  }
}
