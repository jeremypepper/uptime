/**
 * SOCKS4 plugin
 */
var fs   = require('fs');
var ejs  = require('ejs');
var SocksProxyAgent = require('socks-proxy-agent');


var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');

exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    if (type !== 'http' && type !== 'https') return;
    checkDocument.setPollerParam('socks4', dirtyCheck.socks4);
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    if (type !== 'http' && type !== 'https') return;
    partial.push(ejs.render(template, { locals: { check: check } }));
  });

};

exports.initMonitor = function(options) {

  options.monitor.on('pollerCreated', function(poller, check, details) {
    if (check.type !== 'http' && check.type !== 'https') return;
    var socks4 = check.pollerParams && check.pollerParams.socks4;
    if (!socks4) return;
    // add the socks4proxy to the request
    poller.target.agent = new SocksProxyAgent(socks4, check.type === 'https');
  });

};
