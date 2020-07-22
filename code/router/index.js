let _Vue = null;
// 1. 构造函数传入配置项 和路由列表
// 2. 创建路由map方法
// 3. 监听hash值变化
// 3. route.current 变化触发router-view重新渲染
// 4. router-link 触发  route.current 变化
// 5. hashChange  触发 route.current 变化

const getPath = () => {
  return (location.hash && location.hash.slice(1)) || "/";
};
class Router {
  constructor(options) {
    this.options = options;
    this.routeMap = this.createRouteMap(options.routes);
    this.route = Vue.observable({
      current: getPath(),
    });
  }
  createRouteMap(routes = []) {
    let map = {};
    routes.map((v) => {
      map[v.path] = v.component;
    });
    return map;
  }
  init() {
    this.setupListener();
  }
  setupListener() {
    window.addEventListener("hashchange", () => {
      this.route.current = getPath();
    });
  }
  push(path) {
    this.route.current = path;
    location.hash = path;
  }
  static install(Vue) {
    if (this.installed && _Vue) return;
    this.installed = true;
    _Vue = Vue;
    Vue.mixin({
      beforeCreate() {
        if (this.$options.router) {
          this._routerRoot = this;
          this._router = this.$options.router;
          this._router.init(this);
        } else {
          this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
        }
      },
    });
    Object.defineProperty(Vue.prototype, "$router", {
      get() {
        return this._routerRoot._router;
      },
    });
    // 路由视图组件
    Vue.component("RouterView", {
      render(h) {
        console.log("RouterView", 111);
        let compMap = this.$router.routeMap;
        let comp = compMap[this.$router.route.current];
        return h(comp);
      },
    });
    // 路由链接组件
    Vue.component("RouterLink", {
      render(h) {
        let self = this;
        return h(
          "a",
          {
            on: {
              click: self.click,
            },
            attrs: {
                href: self.to
            }
          },
          this.$slots.default
        );
      },
      props: {
        to: {
          type: String,
        },
      },
      methods: {
        click(e) {
          e.preventDefault();
          this.$router.push(this.to);
        },
      },
    });
  }
}
