/**
 * JSON path matching
 *
 * Adds the ability to test the JSON formatted response body against
 * a json path provided by jsonpath: https://github.com/dfilatov/jspath
 *
 */

var fs   = require('fs');
var ejs  = require('ejs');
var JSPath = require('jspath');

var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');

exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    checkDocument.setPollerParam('jsonpaths', dirtyCheck.jsonpaths);
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    partial.push(ejs.render(template, { locals: { check: check } }));
  });
};

exports.initMonitor = function(options) {
  options.monitor.on('pollerPolled', function(check, res, details) {
    var rawQueries = check.pollerParams && check.pollerParams.jsonpaths;

    if (!rawQueries) return;
    var queries = rawQueries.replace(/\r\n/g, '\n').split('\n');
    var json;
    try {
      json = JSON.parse(res.body)
    } catch (e) {
      throw new Error('Could not parse JSON');
    }

    for (var i = 0; i < queries.length; i++) {
      var query = queries[i].trim();
      if (query) {
        if(!JSPath.apply(query, json)) {
          throw new Error('Response body does not match query ' + query);
        }
      }
    };
    return;
  });

};
