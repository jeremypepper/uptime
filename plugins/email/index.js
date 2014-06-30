/**
 * Email plugin
 *
 * Notifies all events (up, down, paused, restarted) by email
 *
 * Installation
 * ------------
 * This plugin is disabled by default. To enable it, add its entry 
 * to the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     - ./plugins/email
 *
 * Usage
 * -----
 * This plugin sends an email each time a check is started, goes down, or goes back up. 
 * When the check goes down, the email contains the error details:
 *
 *   Object: [Down] Check "FooBar" just went down
 *   On Thursday, September 4th 1986 8:30 PM,
 *   a test on URL "http://foobar.com" failed with the following error:
 *
 *     Error 500
 *
 *   Uptime won't send anymore emails about this check until it goes back up.
 *   ---------------------------------------------------------------------
 *   This is an automated email sent from Uptime. Please don't reply to it.
 *
 * Configuration
 * -------------
 * Here is an example configuration:
 *
 *   // in config/production.yaml
 *   email:
 *     method:      SMTP  # possible methods are SMTP, SES, or Sendmail
 *     transport:         # see https://github.com/andris9/nodemailer for transport options
 *       service:   Gmail
 *       auth:            
 *         user:    foobar@gmail.com
 *         pass:    gursikso
 *     event:
 *       up:        true
 *       down:      true
 *       paused:    false
 *       restarted: false
 *     message:           
 *       from:     'Fred Foo <foo@blurdybloop.com>'
 *       to:       'bar@blurdybloop.com, baz@blurdybloop.com'
 *     # The email plugin also uses the main `url` param for hyperlinks in the sent emails
 */
var fs         = require('fs');
var nodemailer = require('nodemailer');
var moment     = require('moment');
var CheckEvent = require('../../models/checkEvent');
var ejs        = require('ejs');

function isTagInConfiguredTags(configuredTags, eventTags) {
  for (var i = 0; i < configuredTags.length; i++) {
    if(eventTags.indexOf(configuredTags[i]) >= 0) return true;
  }
  return false;
}

exports.initWebApp = function(options) {
  var config = options.config.email;
  var mailer = nodemailer.createTransport(config.method, config.transport);
  var templateDir = __dirname + '/views/';
  // used to group emails by message and send them in one email
  var mailQueue = {};
  var timer;
  CheckEvent.on('afterInsert', function(checkEvent) {
    if (!config.event[checkEvent.message]) return;
    checkEvent.findCheck(function(err, check) {
      if (err) return console.error(err);
      // filter on configured tag value if given
      if (!config.tags || config.tags.length === 0 || isTagInConfiguredTags(config.tags, checkEvent.tags)) {
        var filename = templateDir + checkEvent.message + '.ejs';
        var renderOptions = {
          check: check,
          checkEvent: checkEvent,
          url: options.config.url,
          moment: moment,
          filename: filename
        };
        var lines = ejs.render(fs.readFileSync(filename, 'utf8'), renderOptions).split('\n');
        var mailOptions = {
          from:    config.message.from,
          to:      config.message.to,
          subject: lines.shift(),
          text:    lines.join('\n')
        };
        var arr = getMailQueue(checkEvent.message);
        arr.push( { mailOptions: mailOptions, name: check.name });
        if (!timer) {
          timer = setTimeout(sendMailQueue, options.config.email.emailDelay || 70000);
        }
      }
    });
  });

  function getMailQueue(status) {
    if (!mailQueue[status]) {
      mailQueue[status] = [];
    }
    return mailQueue[status];
  }

  function sendMailQueue() {
    var mailOptions;
    clearTimeout(timer);
    timer = undefined;
    var queue = mailQueue;
    mailQueue = {};
    for (var status in queue) {
      if (queue.hasOwnProperty(status)) {
        var arr = queue[status];
        if (arr.length == 1) {
          mailOptions = arr[0].mailOptions;
          return sendMail(mailOptions);
        } else {
          var messages = [];
          for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            messages.push(item.mailOptions.subject);
            messages.push(item.mailOptions.text);
            messages.push("\n");
            messages.push("====================================================================\n");
          }
          if (messages) {
            mailOptions = {
              from:    config.message.from,
              to:      config.message.to,
              subject: "[" + status + "] " + arr.length + " checks went " + status,
              text:    messages.join('\n')
            };
            return sendMail(mailOptions);
          }
        }
      }
    }
  }

  function sendMail(mailOptions) {
    mailer.sendMail(mailOptions, function(err2, response) {
      if (err2) return console.error('Email plugin error: %s', err2);
      console.log('Notified check by email: ' + mailOptions.subject);
    });
  }

  console.log('Enabled Email notifications');
};
