import { vnode } from "./vnode.js";
import * as is from "./is.js";
import { htmlDomApi } from "./htmldomapi.js";
function isUndef(s) {
    return s === undefined;
}
function isDef(s) {
    return s !== undefined;
}
const emptyNode = vnode('', {}, [], undefined, undefined);
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var _a;
    const map = {};
    for (let i = beginIdx; i <= endIdx; ++i) {
        const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
        if (key !== undefined) {
            map[key] = i;
        }
    }
    return map;
}
const hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
export function init(modules, domApi) {
    let i;
    let j;
    const cbs = {
        create: [],
        update: [],
        remove: [],
        destroy: [],
        pre: [],
        post: []
    };
    const api = domApi !== undefined ? domApi : htmlDomApi;
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            const hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    function emptyNodeAt(elm) {
        const id = elm.id ? '#' + elm.id : '';
        const c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                const parent = api.parentNode(childElm);
                api.removeChild(parent, childElm);
            }
        };
    }
    function createElm(vnode, insertedVnodeQueue) {
        var _a, _b;
        let i;
        let data = vnode.data;
        if (data !== undefined) {
            const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
            if (isDef(init)) {
                init(vnode);
                data = vnode.data;
            }
        }
        const children = vnode.children;
        const sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            const hashIdx = sel.indexOf('#');
            const dotIdx = sel.indexOf('.', hashIdx);
            const hash = hashIdx > 0 ? hashIdx : sel.length;
            const dot = dotIdx > 0 ? dotIdx : sel.length;
            const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            const elm = vnode.elm = isDef(data) && isDef(i = data.ns)
                ? api.createElementNS(i, tag)
                : api.createElement(tag);
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    const ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            const hook = vnode.data.hook;
            if (isDef(hook)) {
                (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                if (hook.insert) {
                    insertedVnodeQueue.push(vnode);
                }
            }
        }
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            const ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var _a, _b;
        const data = vnode.data;
        if (data !== undefined) {
            (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
            for (let i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (let j = 0; j < vnode.children.length; ++j) {
                    const child = vnode.children[j];
                    if (child != null && typeof child !== 'string') {
                        invokeDestroyHook(child);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        var _a, _b;
        for (; startIdx <= endIdx; ++startIdx) {
            let listeners;
            let rm;
            const ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (let i = 0; i < cbs.remove.length; ++i)
                        cbs.remove[i](ch, rm);
                    const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                    if (isDef(removeHook)) {
                        removeHook(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else { // Text node
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        let oldStartIdx = 0;
        let newStartIdx = 0;
        let oldEndIdx = oldCh.length - 1;
        let oldStartVnode = oldCh[0];
        let oldEndVnode = oldCh[oldEndIdx];
        let newEndIdx = newCh.length - 1;
        let newStartVnode = newCh[0];
        let newEndVnode = newCh[newEndIdx];
        let oldKeyToIdx;
        let idxInOld;
        let elmToMove;
        let before;
        // diff逻辑 从数据的两端 往中间去 依次判断节点是否为null 如果为null 则将对应节点值往相应的方向移动  
        // 循环结束条件 
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            // 旧的开始节点如果为null 则将旧的开始节点索引往后移动 并将对应位置的节点赋给旧的开始节点变量
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            // 旧的结束节点如果为null 则将旧的开始节点索引往前移动 并将对应位置的节点赋给旧的结束节点变量
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            // 新的开始节点如果为null 则将新的开始节点索引往后移动 并将对应位置的节点赋给新的开始节点变量
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
             // 新的结束节点如果为null 则将新的结束节点索引往前移动 并将对应位置的节点赋给新的结束节点变量
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            // 如果新的开始节点和旧的开始节点相等
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                // 详细对比新的开始节点和旧的开始节点
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                // 旧的开始索引往后移动 并将对应位置的节点赋值给旧的开始节点变量
                oldStartVnode = oldCh[++oldStartIdx];
                 // 新的开始索引往后移动 并将对应位置的节点赋值给新的开始节点变量
                newStartVnode = newCh[++newStartIdx];
            }
            // 如果新的结束节点和旧的结束节点相等
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                // 详细对比新的结束节点和旧的结束节点
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                // 旧的结束索引往前移动 并将对应位置的节点赋值给旧的结束节点变量
                oldEndVnode = oldCh[--oldEndIdx];
                // 新的结束索引往前移动 并将对应位置的节点赋值给新的结束节点变量
                newEndVnode = newCh[--newEndIdx];
            }
             // 如果新的开始节点和旧的结束节点相等
            else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
                 // 详细对比旧的开始节点和新的结束节点
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                // 将旧的开始节点移动到到旧的结束节点后面
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                // 旧的开始索引后移 并将对应位置的值赋值给旧的开始节点变量
                oldStartVnode = oldCh[++oldStartIdx];
                // 新的结束索引前移 并将对应位置的值赋值给新的结束节点变量
                newEndVnode = newCh[--newEndIdx];
            }
            // 如果旧的结束阶段和新的开始节点相等
            else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                // 详细处理旧的结束节点和新的开始节点
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                // 将旧的结束节点移到旧的开始节点前面
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                // 旧的结束节点索引前移  并将对应位置的值赋值给旧的结束节点变量
                oldEndVnode = oldCh[--oldEndIdx];
                // 新的开始节点索引后移 并将对应位置的值赋值给新的开始节点变量
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                // 如果旧的索引和key的map 未定义  则创建旧的所有的key和索引对应的map
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                // 获取新的开始节点的key对应的老节点的所在的位置
                idxInOld = oldKeyToIdx[newStartVnode.key];
                // 如果未在老的节点 中未获取到索引 则新的开始节点为新节点  则创建该开始节点 并将其插入到旧的开始节点dom的前面
                if (isUndef(idxInOld)) { // New element
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                }
                else {
                    // 如果老的节点中存在新的节点
                    elmToMove = oldCh[idxInOld];
                    // 如果两个节点的key相等 但是选择器不相等 则 将创建新的开始节点  并将其插入到老的开始节点的dom前面
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    // 如果移动的节点 和 新的开始节点相同  
                    else {
                        // 详细对比需要移动的老的节点和 新的开始节点
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        // 将旧的节点数组中对应的节点值改为 undefined 避免其对后面的操作造成影响
                        oldCh[idxInOld] = undefined;
                        // 将移动的节点的dom插入到旧的开始节点dom的前面
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                }
                // 新的开始节点索引迁移  并将对应位置的值赋值给新的开始节点
                newStartVnode = newCh[++newStartIdx];
            }
        }
        // 处理新老节点数组中部分节点未被比较到的情况
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            // 如果旧的开始索引大于旧的结束阶段索引 则说明 新的开始索引小于新的结束索引
            if (oldStartIdx > oldEndIdx) {
                // 获取到新的结束索引后面节点的dom
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                // 将新的开始索引和新的结束索引之间的节点插入到上面dom节点的前面
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            else {
                // 说明旧的开始节点索引小于旧的结束节点索引 则移除所有的多余节点
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var _a, _b, _c, _d, _e;
        const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
        (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
        const elm = vnode.elm = oldVnode.elm;
        const oldCh = oldVnode.children;
        const ch = vnode.children;
        if (oldVnode === vnode)
            return;
        if (vnode.data !== undefined) {
            for (let i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
        }
        if (isUndef(vnode.text)) {
            if (isDef(oldCh) && isDef(ch)) {
                // 子节点列表不相等 则 diff改列表
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                // 老的节点列表未定义 如果老的节点有文本则清除将其文本内容设置为空
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                // 添加新的节点列表
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            // 无新子节点列表  则移除老的节点列表
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }// 如果老的接的文本为空 则清空该文本
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        // 如果 新老节点的文本不相等
        else if (oldVnode.text !== vnode.text) {
            // 如果旧子节点列表存在  则清除该节点列表
            if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 将节点的文本设置为新的vnode的text值
            api.setTextContent(elm, vnode.text);
        }
        (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
    }
    return function patch(oldVnode, vnode) {
        let i, elm, parent;
        const insertedVnodeQueue = [];
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        // 如果旧的节点不是一个vNode实例 则 将其转换为vnode节点实例
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        // 如果新老节点相等则详情 对其作对比
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            // 如果两个节点不相等 则通过vNode创建节点
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            // 如果其父节点存在 则将新节点插入到老的节点之前的节点 然后删除老的虚拟节点
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
//# sourceMappingURL=init.js.map