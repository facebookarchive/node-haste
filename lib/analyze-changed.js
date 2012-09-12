/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var AnalyzeChangedTask = require('./AnalyzeChangedTask');

var task;

process.on('message', function(m) {
  if (m.task) {
    task = AnalyzeChangedTask.fromObject(m.task);
  }
  if (m.paths) {
    task.run(m.paths, function(messages, resources, skipped) {
      process.send({
        skipped: skipped,
        resources: resources.map(function(r) {
          return r.toObject();
        }),
        messages: messages.toObject()
      });
    });
  }
  if (m.exit) {
    process.exit(0);
  }
});

