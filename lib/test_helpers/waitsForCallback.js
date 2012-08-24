/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

function waitsForCallback(test, expectation) {
  var args = null;
  var context = null;
  function callback() {
    context = this;
    args = arguments;
  }

  runs(function() {
    test(callback);
  });

  waitsFor(function() {
    return args;
  }, 500);

  runs(function() {
    expectation.apply(context, arguments);
  });
}


module.exports = waitsForCallback;
