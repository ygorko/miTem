# miTem

[![Build Status](https://travis-ci.org/ygorko/miTem.svg?branch=master)](https://travis-ci.org/ygorko/miTem)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/mitem.svg)](https://www.npmjs.org/package/mitem)

miTem.js is small and fast template engine with [twig](twig.symfony.com) like syntax

# Installation
via yarn:
```bash
$ yarn add mitem
```
via npm:
```bash
$ npm install mitem
```
via bower:
```bash
$ bower install mitem
```

# How to use

node:
```javascript 1.7
const miTem = require('./mitem');
let template = miTem.compile("{% for item in arr %}{{item.foo}}{% endfor %}");
template({arr: [{foo:"test "}, {foo:"test2"}]})
```
output:
```bash
test test2
```

web:
```html
<script src="mitem.js"></script>
```
```javascript
var template = miTem.compile("{% for item in arr %}{{item.foo}}{% endfor %}");
template({arr: [{foo:"test "}, {foo:"test2"}]})
```
