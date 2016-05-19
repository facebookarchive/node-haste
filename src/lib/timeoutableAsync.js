'use strict';

const denodeify = require('denodeify');

const createTimeoutPromise = (timeout) => new Promise((resolve, reject) => {
  setTimeout(reject, timeout, 'operation timeout');
});

function race(entries) {
  return new Promise(function(resolve, reject) {
    const length = entries.length;
    for (let i = 0; i < length; i++) {
      Promise.resolve(entries[i]).then(resolve, reject);
    }
  });
}

function timeoutableDenodeify(asyncFunc, timeout) {
  return function raceWrapper(...args) {
    return race([
      createTimeoutPromise(timeout),
      denodeify(asyncFunc).apply(this, args),
    ]);
  };
}

function timeoutableFunction(asyncFunc, timeout) {
  return function raceWrapper(...args) {
    const callback = args[args.length - 1];
    return race([
      createTimeoutPromise(timeout),
      new Promise((resolve, reject) => {
        const asyncArgs = args.slice(0, args.length - 1).concat((...args) => {
          const error = args[0];
          error ? reject(error) : resolve(args.slice(1));
        });
        asyncFunc.apply(this, asyncArgs);
      }),
    ]).then(
      (response) => {
        callback.apply(this, [null, ...response]);
      }, 
      (error) => {
        callback.call(this, error);
      }, 
    );
  };
}

module.exports = {
  timeoutableDenodeify,
  timeoutableFunction,
};