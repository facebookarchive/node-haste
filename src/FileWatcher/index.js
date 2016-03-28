/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const EventEmitter  = require('events').EventEmitter;
const denodeify = require('denodeify');
const sane = require('sane');
const execSync = require('child_process').execSync;

const MAX_WAIT_TIME = 10*60*1000;  // 10mins

const detectWatcherClass = () => {
  try {
    execSync('watchman version', {stdio: 'ignore'});
    return sane.WatchmanWatcher;
  } catch (e) {}
  return sane.NodeWatcher;
};

const WatcherClass = detectWatcherClass();

let inited = false;

class FileWatcher extends EventEmitter {

  constructor(rootConfigs) {
    if (inited) {
      throw new Error('FileWatcher can only be instantiated once');
    }
    inited = true;

    super();
    this._watcherByRoot = Object.create(null);

    const watcherPromises = rootConfigs.map((rootConfig) => {
      return this._createWatcher(rootConfig);
    });

    this._loading = Promise.all(watcherPromises).then(watchers => {
      watchers.forEach((watcher, i) => {
        this._watcherByRoot[rootConfigs[i].dir] = watcher;
/*      Why wait until the watcher is 'ready' to listen to the file-change events it emits?
        Let's move this hook to the '_createWatcher' method        
        watcher.on(
          'all',
          // args = (type, filePath, root, stat)
          (...args) => this.emit('all', ...args)
        );
*/
      });
      return watchers;
    }).catch(function(e) {
      // Mimic of 'done' method for ES6 promises
      // We need to catch error due to MAX_WAIT_TIME timeout here or the error will be silently ignored!
      setTimeout(function() { throw e; });
    });
  }

  getWatchers() {
    return this._loading;
  }

  getWatcherForRoot(root) {
    return this._loading.then(() => this._watcherByRoot[root]);
  }

  isWatchman() {
    return Promise.resolve(FileWatcher.canUseWatchman());
  }

  end() {
    inited = false;
    return this._loading.then(
      (watchers) => watchers.map(
        watcher => denodeify(watcher.close).call(watcher)
      )
    );
  }

  _createWatcher(rootConfig) {
    var _this = this;
    
    const watcher = new WatcherClass(rootConfig.dir, {
      glob: rootConfig.globs,
      dot: false,
    });

    return new Promise((resolve, reject) => {
      const rejectTimeout = setTimeout(
        () => reject(new Error(timeoutMessage(WatcherClass))),
        MAX_WAIT_TIME
      );

      watcher.once('ready', () => {
        clearTimeout(rejectTimeout);
        resolve(watcher);
      });
      
      watcher.on(
        'all',
        // args = (type, filePath, root, stat)
        (...args) => _this.emit('all', ...args)
      );
      
    });
  }

  static createDummyWatcher() {
    return Object.assign(new EventEmitter(), {
      isWatchman: () => Promise.resolve(false),
      end: () => Promise.resolve(),
    });
  }

  static canUseWatchman() {
    return WatcherClass == sane.WatchmanWatcher;
  }
}

function timeoutMessage(Watcher) {
  const lines = [
    'File watcher took too long to load (Library being used: ' + Watcher.name + ')',
  ];
  if (Watcher === sane.WatchmanWatcher) {
    lines.push(
      'Try running `watchman version` from your terminal',
      'https://facebook.github.io/watchman/docs/troubleshooting.html',
    );
  } else {
    lines.push('The current library being used by the file watcher is NodeWatcher. We recommend you install Watchman on your system (http://facebook.github.io/watchman/) and run the app again to check if file crawling runs faster then.');
  }
  lines.push('You may also increase the value of the MAX_WAIT_TIME timeout variable located in '+__filename+'\n');
  return lines.join('\n');
}

module.exports = FileWatcher;
