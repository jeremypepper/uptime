/**
 * Pushover plugin for the uptime project - https://github.com/fzaninotto/uptime
 * Thanks to DMathieu for the Campfire plugin which I basically hacked up to make this
 * work:  https://gist.github.com/dmathieu/5592418
 *
 * This index.js files goes to a directory `plugins/pushover` in your installation of uptime.
 *
 * Notifies all events (up, down, paused, restarted) to pushover
 *
 * This plugin has a dependency on `pushover-notifications`.
 * Add this to the "dependencies" object in your `package.json` file :
 *
 *   "pushover-notifications":    "0.1.5"
 *
 *
 * To enable the plugin, add the following line to the plugins section of your config file
 * plugins:
 *  - ./plugins/pushover
 *
 * Example configuration
 *
 *   pushover:
 *     token: 8973lkhjfdso8y3 # Authentication token from pushover for app
 *     user: 09r4ljfdso98r # This is the user token you want to send to
 *
 *     event:
 *       up:        true
 *       down:      true
 *       paused:    false
 *       restarted: false
 */
var config     = require('config').pushover;
var Ping = require('../../models/ping');
var CheckEvent = require('../../models/checkEvent');
var pushover   = require('pushover-notifications');

 exports.initWebApp = function(enableNewEvents, enableNewPings) {
  if (typeof enableNewEvents == 'undefined') enableNewEvents = true;
  if (typeof enableNewPings == 'undefined') enableNewPings = true;
  if (enableNewEvents) registerNewEventsLogger();
  if (enableNewPings)  registerNewPingsLogger();
};

var registerNewEventsLogger = function() {
  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function(err, check) {
      switch (checkEvent.message) {
        case 'paused':
        case 'restarted':
        case 'up':
            //if (checkEvent.downtime) {
          break;
        case 'down':
            var msg = {
                message: "The application " + check.name + " just went to status " + checkEvent.message,
                title: "Uptime Status",
                // sound: 'persistent', // optional
                priority: 1 // optional
        };

      var push     = new pushover({
          token: config.token
      });

      push.user    = config.user;

      push.send( msg, function( err, result ) {
        if ( err ) {
                throw err;
        }
        console.log( result );
        });
          break;
        default:
        ;
      }
    });
  });
  console.log('Enabled Pushover notifications');
};

var registerNewPingsLogger = function() {
  Ping.on('afterInsert', function(ping) {
    ping.findCheck(function(err, check) {
    });
  });
};
