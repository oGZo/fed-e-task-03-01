class Dep {
    constructor(){
        this.subDeps = []
    }
    addDep(sub) {
        if(sub.update){
            this.subDeps.push(sub);
        }
    }
    notify() {
        this.subDeps.forEach(sub => {
            sub.update();
        })
    }
}