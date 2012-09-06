/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var AnalyzeChangedTask = require('./AnalyzeChangedTask');

process.on('message', function(m) {
  var task = AnalyzeChangedTask.fromObject(m.task);
  task.run(m.paths, function(messages, resources, skipped) {
    process.send({
      skipped: skipped,
      resources: resources.map(function(r) {
        return r.toObject();
      }),
      messages: messages.toObject()
    });
    process.exit(0);
  });
});

