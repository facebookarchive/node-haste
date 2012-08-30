/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var E = String.fromCharCode(27);

function wrap(options, text) {
  return E + '[' + options + 'm' + text + E + '[m';
}

function bold(text) {
  return wrap('1', text);
}

function underline(text) {
  return wrap('4', text);
}

function awesome(text) {
  return wrap('1;4;7;5;42;35', text);
}

var colors = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7
}
function color(color, text) {
  return E + '[' + (colors[color] + 30) + 'm' + text + E + '[39m';
}

exports.bold = bold;
exports.underline = underline;
exports.awesome = awesome;
exports.color = color;
