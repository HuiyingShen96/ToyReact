function createElement(tagName, attributes, ...children) {
  const e = document.createElement(tagName);
  for (const p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  for (const child of children) {
    if (typeof child === 'string') {
      child = document.createTextNode(child); // 使用 createTextNode() 可以创建文本节点
    }
    e.appendChild(child);
  }
  return e;
}

document.body.appendChild(<div id="test" class="class1">text1<span class="class2">text2</span></div>);