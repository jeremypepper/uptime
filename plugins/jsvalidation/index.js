
const {NodeVM} = require('vm2');

var fs = require('fs');
var ejs = require('ejs');
var _ = require('lodash');
var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');

exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    checkDocument.setPollerParam('jsvalidate', dirtyCheck.jsvalidate);
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    partial.push(ejs.render(template, { locals: { check: check } }));
  });
};

exports.initMonitor = function(options) {
  options.monitor.on('pollerPolled', function(check, response, details) {
    var commandText = check.pollerParams && check.pollerParams.jsvalidate;

    if (!commandText) return;
    var json;
    try {
      json = JSON.parse(response.body);
    } catch (ignored) {
    }

    const vm = new NodeVM({
      console: 'inherit',
      sandbox: {
        _, // lodash
        url: check.url,
        statusCode: response.statusCode,
        body: response.body,
        json,
        params: check.pollerParams,
        response
      },
      require: {
        external: false,
        builtin: [],
        root: "./"
      }
    });
    const result = vm.run("module.exports=function() {" + commandText + "}")();
    if (!result) {
      throw new Error("Error in custom js validation. Validation returned " + result);
    }
  });
};
