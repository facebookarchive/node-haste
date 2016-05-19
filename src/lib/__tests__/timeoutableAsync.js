/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../timeoutableAsync');

const timeoutableAsync = require('../timeoutableAsync');

describe('timeoutableAsync', function() {
  
  describe('.timeoutableDenodeify()', function() {
  
    pit('should reject promise after timeout', function() {
      function asyncFunc(callback) {
        setTimeout(callback, 600, null, 'Success');
      }
      const reject = jest.fn();
      const res = timeoutableAsync.timeoutableDenodeify(asyncFunc, 500)()
        .then(null, reject)
        .then(() => {
          expect(reject).toBeCalledWith('operation timeout');
        });
      jest.runAllTimers();
      return res;
    });

    pit('should reject promise if async function finsihes with error first', 
    function() {
      function asyncFunc(callback) {
        setTimeout(callback, 300, 'Error in callback');
      }
      const reject = jest.fn();
      const res = timeoutableAsync.timeoutableDenodeify(asyncFunc, 500)()
        .then(null, reject)
        .then(() => {
          expect(reject).toBeCalledWith('Error in callback');
        });
      jest.runAllTimers();
      return res;
    });
    
    pit('should resolve promise if async function finsihes with first without errors', 
    function() {
      function asyncFunc(callback) {
        setTimeout(callback, 300, null, 'Success');
      }
      const resolve = jest.fn();
      const reject = jest.fn();
      const res = timeoutableAsync.timeoutableDenodeify(asyncFunc, 500)()
        .then(resolve, reject)
        .then(() => {
          expect(reject).not.toBeCalled();
          expect(resolve).toBeCalledWith('Success');
        });
      jest.runAllTimers();
      return res;
    });
    
  });
  
  describe('.timeoutableFunction()', function() {
  
    it('should call error callback after timeout', function(done) {
      function asyncFunc(param1, param2, callback) {
        expect(param1).toBe('First Param');
        expect(param2).toBe('Second Param');
        setTimeout(callback, 600, null, 'Success');
      }
      const timeoutable = timeoutableAsync.timeoutableFunction(asyncFunc, 500);
      timeoutable('First Param', 'Second Param', (error, response) => {
        expect(error).toBe('operation timeout');
        done();
      });
      jest.runAllTimers();
    });

    it('should call error callback if async returns error before timeout', 
    function(done) {
      function asyncFunc(callback) {
        setTimeout(callback, 300, 'Error');
      }
      const timeoutable = timeoutableAsync.timeoutableFunction(asyncFunc, 500);
      timeoutable((error, response) => {
        expect(error).toBe('Error');
        done();
      });
      jest.runAllTimers();
    });

    it('should call success callback if async returns success before timeout', 
    function(done) {
      function asyncFunc(callback) {
        setTimeout(callback, 300, null, 'Success response 1', 'Success response 2');
      }
      const timeoutable = timeoutableAsync.timeoutableFunction(asyncFunc, 500);
      timeoutable((error, response1, response2) => {
        expect(error).toBe(null);
        expect(response1).toBe('Success response 1');
        expect(response2).toBe('Success response 2');
        done();
      });
      jest.runAllTimers();
    });
    
  });
});
