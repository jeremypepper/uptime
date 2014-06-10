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
    if (!dirtyCheck.chain_id) return;
    var chain_id = dirtyCheck.chain_id;
    checkDocument.setPollerParam('chain_id', dirtyCheck.chain_id );
  });

  dashboard.on('checkEdit', function(type, check, partial) {
    check.chain_id = '';
    var options = check.getPollerParam('chain_id');
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
  var pollerById = {};
  options.monitor.on('pollerCreated', function(poller, check, details) {
    pollerById[poller._id] = poller; 
  });

  options.monitor.on('pollerPolled', function(check, res, details) {
    var chain_id = check.pollerParams && check.pollerParams.chain_id;
    if (chain_id) {
      // get the check of the given id
      findCheckById(chain_id, options.monitor, function(error, chainedCheck) {
        if (!error && chainedCheck) {
          // attach the parent poller to the current poller
          var parentPoller = pollerById[check.id];
          chainedCheck.pollerParams.parentPoller = parentPoller;
          options.monitor.pollCheck(chainedCheck, function(err, body) {
            if(err) {
              console.log(err); return  
            }
          });
        } else {
          console.error("could not chain to", chain_id, error);
        }
      });
    }
    
  });

};
