// Randomizer Plugin - randomizes a value in the http body regex matching field
// Currently onlys supports replacing {{{RANDOM_INT}}} in the match and body fields
exports.initMonitor = function(options) {
  options.monitor.on('pollerCreated', function(poller, check, details) {
  	var randomInt = Math.ceil(Math.random() * 1000);
		// if the parent of a chained call has generated a randomInt, use that instead
		if (check.pollerParams && check.pollerParams.parentPoller && check.pollerParams.parentPoller.target &&
	  			check.pollerParams.parentPoller.target.randomInt) {
	  	randomInt = check.pollerParams.parentPoller.target.randomInt;
	  }
    // replace {{{RANDOM_INT}}} in the body
    if (poller.target.body) {
	    poller.target.body = poller.target.body.replace("{{{RANDOM_INT}}}", function(match) {
	      poller.target.randomInt = randomInt;
	      return randomInt;
	    });
  	}

    // replace {{{RANDOM_INT}}} in the regex matcher
    if (check.pollerParams && check.pollerParams.match) {
	  	check.pollerParams.match = check.pollerParams.match.replace("{{{randomInt}}}", randomInt);
	  }
  });
};
