/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

function loadResource(loader, filePath, conf, expectation) {
  var resource;
  var error;
  var complete = false;
  runs(function() {
    loader.loadFromPath(filePath, conf, function(e, r) {
      resource = r;
      error = e;
      complete = true;
    });
  });

  waitsFor(function() {
    return complete;
  }, 500);

  runs(function() {
    expectation(error, resource);
  });
}

module.exports = loadResource;
