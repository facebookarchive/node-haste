/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var esprima = require('esprima/esprima');
var Syntax = esprima.Syntax;

function traverse(node, visitor) {
  var key, child;

  if (visitor(node) === false) {
    return;
  }
  for (key in node) {
    child = node[key];
    if (typeof child === 'object' && child !== null) {
      traverse(child, visitor);
    }
  }
}

var javelinInstallsRe = /@javelin-installs\s+(.*)/g;
function extractJavelinSymbols(code) {
  var ast = esprima.parse(code);
  var defines = {};
  var requires = {};
  var id = null;

  var visitor = function (node) {
    if (node.type === Syntax.MemberExpression && !node.computed &&
      node.object.name === 'JX') {
      var symbolName = 'JX.' + node.property.name;
      if (!defines[symbolName]) {
        requires[symbolName] = true;
      }
    }
  };

  ast.body.forEach(function(node) {
    var symbolName;
    // Look for calls to JX.install() and JX.behavior()
    if (node.type === Syntax.ExpressionStatement &&
      node.expression.type === Syntax.CallExpression &&
      node.expression.callee.type === Syntax.MemberExpression &&
      !node.expression.callee.object.computed &&
      node.expression.callee.object.name === 'JX') {

      var expressionArgs = node.expression['arguments'];
      if (node.expression.callee.property.name === 'install') {
        symbolName = 'JX.' + expressionArgs[0].value;
        defines[symbolName] = true;
        if (!id) {
          id = symbolName;
        }
      } else if (node.expression.callee.property.name === 'behavior') {
        symbolName = 'javelin-behavior-' + expressionArgs[0].value;
        defines[symbolName] = true;
        if (!id) {
          id = symbolName;
        }
      }
    }
  });

  ast.body.forEach(function(node) {
    traverse(node, visitor);
  });

  var match;
  // Next we need to look at the docblock for javelin-installs.
  while (match = javelinInstallsRe.exec(code)) {
    var name = 'JX.' + match[1].split('.')[1];
    delete requires[name];
    defines[name] = true;
  }

  return {
    id: id,
    defines: Object.keys(defines),
    requires: Object.keys(requires)
  };
}

module.exports = extractJavelinSymbols;
