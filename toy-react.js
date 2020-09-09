const RENDER_TO_DOM = Symbol('render to dom');


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
    this.render()[RENDER_TO_DOM](range);
  }

  rerender() {
    const oldRange = this._range;

    const range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }

  setState(newState) {
    // 注意：typeof null得到'object'，所以一定要分开判断
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
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
    this.rerender();
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
    this.root = document.createElement(type);
  }

  // setAttribute(name, value) {
  //   // [\s\S] 表示所有的字符集合
  //   if (name.match(/^on([\s\S]+)$/)) {
  //     this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
  //   } else {
  //     if (name === 'className') {
  //       this.root.setAttribute('class', value);
  //     } else {
  //       this.root.setAttribute(name, value);
  //     }
  //   }
  // }

  // appendChild(component) {
  //   let range = document.createRange();
  //   range.setStart(this.root, this.root.childNodes.length);
  //   range.setEnd(this.root, this.root.childNodes.length);
  //   component[RENDER_TO_DOM](range);
  // }

  get vdom() {
    return {
      type: this.type,
      props: this.props,
      children: this.children.map(child => child.vdom)
    }
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.content = content;
    this.root = document.createTextNode(content);
  }

  get vdom() {
    return {
      type: '#text',
      content: this.content,
    }
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
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