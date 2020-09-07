import { createElement, Component, render } from './toy-react';

class MyComponent extends Component {
  render() {
    return <div>
      <h1>my component</h1>
      {this.children}
    </div>;
  }
}

render(<MyComponent id="test" class="class1">text1<span class="class2">text2</span></MyComponent>, document.body);