'use strict';

const nodeCrawl = require('./node');
const watchmanCrawl = require('./watchman');

function checkWatchman(fileWatcher) {
  if (!fileWatcher) {
    return Promise.resolve(false);
  }

  return fileWatcher.isWatchman().then(isWatchman => {
    if (!isWatchman) {
      return false;
    }

    // Make sure we're dealing with a version of watchman
    // that's using `watch-project`
    // TODO(amasad): properly expose (and document) used sane internals.
    return fileWatcher.getWatchers().then(([watcher]) => !!watcher.watchProjectInfo.root);
  });
}

function crawl(roots, options) {
  return checkWatchman(options.fileWatcher).then(
    isWatchman => isWatchman ? watchmanCrawl(roots, options) : nodeCrawl(roots, options)
  );
}

module.exports = crawl;
