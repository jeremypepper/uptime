// Randomizer Plugin - randomizes a value in the http body regex matching field
// Currently only supports replacing {{{RANDOM}}} in the match and body fields with a number between 1-127
exports.initMonitor = function(options) {
  options.monitor.on('pollerCreated', function(poller, check, details) {
    var randomMatcher = /{{{RANDOM}}}/g;
  	var randomInt = Math.ceil(Math.random() * 127);
		// if the parent of a chained call has generated a randomInt, use that instead
		if (check.pollerParams && check.pollerParams.parentPoller && check.pollerParams.parentPoller.target &&
	  			check.pollerParams.parentPoller.target.randomInt) {
	  	randomInt = check.pollerParams.parentPoller.target.randomInt;
	  }
    // replace {{{RANDOM}}} in the body
    if (poller.target.body) {
	    poller.target.body = poller.target.body.replace(randomMatcher, function(match) {
	      poller.target.randomInt = randomInt;
	      return randomInt;
	    });
  	}

    // replace {{{RANDOM}}} in the regex matcher
    if (check.pollerParams && check.pollerParams.match) {
	  	check.pollerParams.match = check.pollerParams.match.replace(/{{{RANDOM}}}/g, randomInt);
	  }
  });
};
