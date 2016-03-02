'use strict';

const path = require('./fastpath');

class Package {

  constructor({ file, fastfs, cache, replacements = {} }) {
    this.path = file;
    this.root = path.dirname(this.path);
    this._fastfs = fastfs;
    this.type = 'Package';
    this._cache = cache;
    this.replacements = replacements;
  }

  getMain() {
    return this.read().then(json => {
      var replacements = getReplacements(json);
      if (typeof replacements === 'string') {
        return path.join(this.root, replacements);
      }
      let main = json.main || 'index';
      // cut of the extension, if any
      main = main.replace(/(\.js|\.json)$/, '');
      // find a possible replacement
      var replacement = this.getReplacement(main, replacements);
      if (replacement !== undefined) {
        main = replacement;
      }
      return path.join(this.root, main);
    });
  }

  isHaste() {
    return this._cache.get(this.path, 'package-haste', () =>
      this.read().then(json => !!json.name)
    );
  }

  getName() {
    return this._cache.get(this.path, 'package-name', () =>
      this.read().then(json => json.name)
    );
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  getReplacement(name, replacements) {
    if (typeof replacements !== 'object') {
      return undefined;
    }
    const relPath = './' + path.relative(this.root, name);
    const relName = './' + name;
    const checks = [
      replacements[name],
      replacements[name + '.js'],
      replacements[name + '.json'],
      replacements[relName],
      replacements[relName + '.js'],
      replacements[relName + '.json'],
      replacements[relPath],
      replacements[relPath + '.js'],
      replacements[relPath + '.json'],
    ];
    const matches = checks.filter(check => check !== undefined);
    if (matches[0] === false) {
      return false;
    }
    return matches[0] || undefined;
  }

  redirectRequire(name) {
    return this.read().then(json => {
      let replacements = getReplacements(json);
      if (typeof replacements === 'string') {
        replacements = {
          [json.main || 'index']: replacements,
        };
      }
      const replacement = this.getReplacement(name, replacements);
      // no replacement
      if (replacement === undefined) {
        // could stil be requiring a builtin
        if (this.replacements[name]) {
          var redirect = path.relative(this.root, this.replacements[name]);
          // cut off node_modules if the builtin is required
          // from the "index" of the react-native project
          if (redirect.slice(0, 13) === 'node_modules/') {
            redirect = redirect.slice(13);
          }
          return redirect;
        }
        return name;
      }
      // replacement is false boolean
      if (replacement === false) {
        // find path to _empty.js
        const emptyPath = require.resolve('./_empty.js');
        return './' + path.relative(this.root, emptyPath);
      }
      // replacement is other module (or absolute path?)
      if (replacement[0] !== '.') {
        return replacement;
      }
      // replacement is relative path
      return path.join(this.root, replacement);
    });
  }

  read() {
    if (!this._reading) {
      this._reading = this._fastfs.readFile(this.path)
        .then(jsonStr => JSON.parse(jsonStr));
    }

    return this._reading;
  }
}

function getReplacements(pkg) {
  return pkg['react-native'] == null
    ? (pkg.browser == null ? pkg.browserify : pkg.browser)
    : pkg['react-native'];
}

module.exports = Package;
