const RENDER_TO_DOM = Symbol('render to dom');

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._range = null;
  }

  get vdom() {
    return this.render().vdom;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.children.push(component);
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    // 这里调用了获取this.vdom的getter，会得到一个新的vdom树
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  /**
   * 对比新旧vdom，找出要重新渲染的位置
   */
  update() {
    const isSameNode = (oldNode, newNode) => {
      // 类型不同
      if (oldNode.type !== newNode.type) return false;

      // 属性不同
      for (const name in newNode.props) {
        if (oldNode.props[name] !== newNode.props[name]) return false;
      }

      // 属性的数量不同
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) return false;

      // 文本内容不同
      if (newNode.type === '#text' && newNode.content !== oldNode.content) return false;

      return true;
    };

    const update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      const newChildren = newNode.vchildren;
      const oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) return;

      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          // 插入节点
          const range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };

    const vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }

  setState(newState) {
    // 注意：typeof null得到'object'，所以一定要分开判断
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update();
      return;
    }
    let merge = (oldState, newState) => {
      for (const p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };
    merge(this.state, newState);
    this.update();
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  get vdom() {
    this.vchildren = this.children.map(child => child.vdom);
    return this;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;

    const root = document.createElement(this.type);

    for (const name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) { // [\s\S] 表示所有的字符集合
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
      } else {
        if (name === 'className') {
          root.setAttribute('class', value);
        } else {
          root.setAttribute(name, value);
        }
      }
    }

    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom);
    }

    for (const child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }

    replaceContent(range, root);
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.content = content;
    this.type = '#text';
  }

  get vdom() {
    return this;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    const root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}


export function createElement(type, attributes, ...children) {
  let e = null;
  if (typeof type === 'string') {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }
  for (const p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (const child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child); // 使用 createTextNode() 可以创建文本节点
      }
      if (child === null) {
        continue;
      }
      if ((typeof child === 'object') && (child instanceof Array)) {
        insertChildren(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChildren(children);
  
  return e;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}