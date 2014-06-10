var fs   = require('fs');
var ejs  = require('ejs');
var express = require('express');
var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');
exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    if (type !== 'http' && type !== 'https') return;
    if (!dirtyCheck.body_content) return;
    checkDocument.setPollerParam('body_content', dirtyCheck.body_content );
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    if (type !== 'http' && type !== 'https') return;
    check.body_content = '';
    var options = check.getPollerParam('body_content');
    partial.push(ejs.render(template, { locals: { check: check } }));
  });

  options.app.use(express.static(__dirname + '/public'));
};

exports.initMonitor = function(options) {

  options.monitor.on('pollerCreated', function(poller, check, details) {
    if (check.type !== 'http' && check.type !== 'https') return;
    var body_content = check.pollerParams && check.pollerParams.body_content;
    if (!body_content) return;
    poller.target.body = body_content;
    return;
  });

};
