class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }

  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.children.push(component);
  }

  get root() {
    if (!this._root) {
      // 如果我们 render 出来的仍然是一个 Component，那么这个地方就会发生一次递归，直到得到一个 ElementWrapper 或 TextWrapper 为根节点的 Component。
      this._root = this.render().root;
    }
    return this._root;
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
  parentElement.appendChild(component.root);
}