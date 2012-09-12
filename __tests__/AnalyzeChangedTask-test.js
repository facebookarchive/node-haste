/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('AnalyzeChangedTask', function() {

  var AnalyzeChangedTask = require('../lib/AnalyzeChangedTask');
  var ConfigurationTrie = require('../lib/ConfigurationTrie');
  var loaders = require('../lib/loaders');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  describe('serialize', function() {

    it('should serialize loaders', function() {
      var task = new AnalyzeChangedTask(
        [
          new loaders.JSLoader({
            extractSpecialRequires: true,
            networkSize: true
          }),
          new loaders.CSSLoader({
            networkSize: true
          }),
          new loaders.ImageLoader(),
          new loaders.ProjectConfigurationLoader(),
          new loaders.ResourceLoader()
        ],
        new ConfigurationTrie([]));

      var task2 = AnalyzeChangedTask.fromObject(task.toObject());

      expect(task2.loaders.length).toBe(5);
      expect(task2.loaders[0]).toEqual(jasmine.any(loaders.JSLoader));
      expect(task2.loaders[1]).toEqual(jasmine.any(loaders.CSSLoader));
      expect(task2.loaders[2]).toEqual(jasmine.any(loaders.ImageLoader));
      expect(task2.loaders[3])
        .toEqual(jasmine.any(loaders.ProjectConfigurationLoader));
      expect(task2.loaders[4]).toEqual(jasmine.any(loaders.ResourceLoader));
      expect(task2.loaders[0].options).toEqual({
        extractSpecialRequires: true,
        networkSize: true
      });
    });

    it('should serialize ConfigurationTrie', function() {
      var task = new AnalyzeChangedTask(
        [],
        new ConfigurationTrie([
          new ProjectConfiguration('a/package.json', { foo: 'bar' }),
          new ProjectConfiguration('b/c/package.json', {})
        ]));

      var task2 = AnalyzeChangedTask.fromObject(task.toObject());
      expect(task2.configurationTrie.configurations.length).toBe(2);

    });
  });

  describe('Loading', function() {
    var path = require('path');
    var waitsForCallback = require('../lib/test_helpers/waitsForCallback');
    var MessageList = require('../lib/MessageList');
    var Resource = require('../lib/resource/Resource');
    var testData = path.join(__dirname, '..', '__test_data__', 'JS');

    it('should aggregate messages from loaders', function() {
      var loader = new loaders.ResourceLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          var messages = new MessageList();
          messages.addError(path, 'foo', 'bar');
          callback(messages, new Resource(path));
        });

      waitsForCallback(
        function(callback) {
          task.run(['a/b.js', 'a/c.js'], callback);
        },
        function(messages) {
          expect(messages.length).toBe(2);
        }
      );
    });

    it('should load resource when changed', function() {
      var loader = new loaders.ResourceLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          expect(path).toBe('sub/added.js');
          expect(configuration).toBe(undefined);
          callback(new MessageList(), new Resource('sub/added.js'));
        });

      waitsForCallback(
        function(callback) {
          task.run(['sub/added.js'], callback);
        },
        function() {}
      );
    });

    it('should load resource with matching configuration', function() {
      var loader = new loaders.ResourceLoader();
      var config = new ProjectConfiguration('sub/project.json', {});
      var task = new AnalyzeChangedTask(
        [loader],
        new ConfigurationTrie([config]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          expect(path).toBe('sub/added.js');
          expect(configuration).toBe(config);
          callback(new MessageList(), new Resource('sub/added.js'));
        });

      waitsForCallback(
        function(callback) {
          task.run(['sub/added.js'], callback);
        },
        function() {}
      );
    });

    it('should load resource in a subprocess', function() {
      var loader = new loaders.JSLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));

      waitsForCallback(
        function(callback) {
          task.runInForks(1, [path.join(testData, 'module.js')], callback);
        },
        function(messages, resources, skipped) {
          expect(resources.length).toBe(1);
          expect(resources[0])
            .toEqual(jasmine.any(require('../lib/resource/JS')));
        }
      );
    });

    it('should load resource in a subprocess with messages', function() {
      var loader = new loaders.JSLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));

      waitsForCallback(
        function(callback) {
          task.runInForks(
            1,
            [path.join(testData, 'deprecated.js')],
            callback);
        },
        function(messages, resources, skipped) {
          expect(messages.length).toBe(1);
          expect(messages.render()).toContain('@suggests is deprecated');
        }
      );
    });
  });
});
