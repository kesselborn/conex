// alias for document.querySelectorAll
const $ = function(s){ return document.querySelectorAll(s); };

// alias for document.querySelector
const $1 = function(s){ return document.querySelector(s); };

// creates a dom element, can contain children; attributes contains a map of the elements attributes
// with 'content' being a special attribute representing the text node's content; underscores in
// keys will be changed to dashes
//
// $e('div', {class: 'foo'}, [
//   $e('span', {class: 'bar1', data_foo: 'bar', content: 'baz1'}),
//   $e('span', {class: 'bar2', content: 'baz2y})
// ]);
//
// will produce:
//
// <div class='foo'><span class='bar1' data-foo='bar'>baz1</span><span class='bar2'>baz2</span></div>
//
const $e = function(name, attributes, children) {
  const e = document.createElement(name);
  for(const key in attributes) {
    if(key == 'content') {
      e.appendChild(document.createTextNode(attributes[key]));
    } else {
      e.setAttribute(key.replace(/_/g, '-'), attributes[key]);
    }
  }

  for(const child of children || []) {
    e.appendChild(child);
  }

  return e;
};

