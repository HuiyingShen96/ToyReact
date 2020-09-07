## 环境搭建

### 新建项目 toy-react

### 初始化项目

`npm init`

react优势之一：支持JSX（本课不实现）



### webpack配置

#### 安装

安装webpack：`npm install webpack webpack-cli --save-dev`

#### 默认配置文件*webpack.config.js*

推荐使用符合node.js标准（CommonJS标准）的module.exports的写法。

原因：我们没有办法对webpack本身去做babel的转换

#### 打包

命令：`npx webpack`。默认输出到 */dist* 目录下。

打包出一个可阅读的文件，需要增加两个配置：

```js
// webpack.config.js

module.exports = {
  // ...其它配置
  mode: "development",
  optimization: {
    minimize: false,
  }
};
```

打包出来的文件有这样一行代码：

```js
eval("\n\n//# sourceURL=webpack:///./main.js?");
```

由于带了sourceURL，我们在浏览器里打开main.js时，eval的这个部分就会被映射成一个单独的文件 。这样webpack就能给我们提供一个非常易于人类阅读和调试的版本。

#### babel-loader

babel可以将新版本的js转成旧版本的js。方便我们使用新语言特性来写代码，编译之后也能支持在较旧的浏览器上运行我们的代码。

安装：`npm install --save-dev babel-loader @babel/core`

babel本身是不带任何配置的一个核心，为了安装一个我们比较常用的配置的选项， 还需要安装一个@babel/preset-env

继续安装：`npm install --save-dev @babel/preset-env`

#### webpack的babel-loader配置

```js
// webpack.config.js
module.exports = {
  // ...其它配置
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      }
    ],
  },
};
```

#### 支持JSX

安装一个babel里面专门用来处理JSX的plugin（和preset的区别是，一个preset里面可能会包含若干个plugin）：`npm install @babel/plugin-transform-react-jsx --save-dev`

然后修改webpack配置中babel的options：

```js
// webpack.config.js
module.exports = {
  // ...其它配置
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-react-jsx'], // 新增配置以支持JSX语法
          }
        }
      }
    ],
  },
};
```

另外，使用 pragma 参数可以指定最后翻译出来的函数名字：

```js
plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'createElement' }]]
```



## 如何实现JSX翻译出来的函数

### 初步实现

先观察一段简单的JSX代码被编译出来、浏览器可执行的代码：

```jsx
// 源代码
const div = <div id="test" class="class1">text1<span class="class2">text1</span></div>;

// 编译后的代码
const div = createElement("div", {
  id: "test",
  "class": "class1"
}, "text1", createElement("span", {
  "class": "class2"
}, "text1"));
```

可以看到我们需要实现一个createElement方法，接收的参数是：tagName、属性对象、子节点1、子节点2、子节点3……

初步实现的代码：

```js
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
```



## JSX里的自定义组件机制

背景：在JSX里有个设定，如果tagName以小写字母开头，就会被认为是一个原生的标签名；相反，如果是以大写字母开头，就会被编译成一个变量名，如：

```jsx
// 源代码
const a = <div></div>;
const b = <Div></Div>;

// 编译得到的代码
var a = createElement("div", null);
var b = createElement(Div, null); // 报错 Uncaught ReferenceError: Div is not defined
```
