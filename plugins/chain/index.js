// Chain Plugin - runs one check after another check completes.
var fs   = require('fs');
var ejs  = require('ejs');
var url  = require('url');
var http = require('http');
var express = require('express');
var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');
exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    checkDocument.setPollerParam('chainDelay', dirtyCheck.chainDelay);
    checkDocument.setPollerParam('chain_id', dirtyCheck.chain_id);
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    partial.push(ejs.render(template, { locals: { check: check } }));
  });

  options.app.use(express.static(__dirname + '/public'));
};

function findCheckById(id, monitor, callback) {
  var options = url.parse(monitor.config.apiUrl + '/checks/' + id);
  monitor.applyApiHttpOptions(options);
  http.get(options, function(res) {
    if (res.statusCode != 200) {
      return callback(new Error(monitor.config.apiUrl + '/checks/id resource responded with error code: ' + res.statusCode));
    }
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, JSON.parse(body));
    });
  }).on('error', function(e) {
    callback(new Error(monitor.config.apiUrl + '/checks/id resource not available: ' + e.message));
  });
};

exports.initMonitor = function(options) {
  var pollerByCheckId = {};
  options.monitor.on('pollerCreated', function(poller, check, details) {
    pollerByCheckId[check._id] = poller; 
  });

  options.monitor.on('pollerPolled', function(check, res, details) {
    var chain_id = check.pollerParams && check.pollerParams.chain_id;
    if (chain_id) {
      // get the check of the given id
      findCheckById(chain_id, options.monitor, function(error, chainedCheck) {
        if (!error && chainedCheck && chainedCheck.pollerParams) {
          // attach the parent poller to the current poller
          var parentPoller = pollerByCheckId[check._id];
          chainedCheck.pollerParams.parentPoller = parentPoller;
          setTimeout(function() {
            options.monitor.pollCheck(chainedCheck, function(err, body) {
              if(err) {
                console.log(err); return;
              }
            });
          }, check.pollerParams.chainDelay);
        } else {
          console.error("could not chain to", chain_id, error);
        }
      });
    }
  });
};
