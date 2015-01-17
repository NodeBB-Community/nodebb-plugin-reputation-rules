"use strict";

var plugin = {},
	ReputationManager = new (require('./ReputationManager'))(),
	ReputationParams = require('./ReputationParams');


plugin.upvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid, vote.current);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on upvote hook');
			return;
		}

		console.log('user can upvote post? ' + ReputationManager.userCanUpvotePost(data.user, data.post));

		if (!ReputationManager.userCanUpvotePost(data.user, data.post)) {
			//TODO remove vote, without triggering the unvote hook
		} else {
			//TODO calculate vote value and increase rep for post author
		}
	});
};

plugin.downvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid, vote.current);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		console.log('user can downvote post? ' + ReputationManager.userCanDownvotePost(data.user, data.post));

		if (!ReputationManager.userCanDownvotePost(data.user, data.post)) {
			//TODO remove downvote
		} else {
			//TODO decrease user's reputation by 1 (if you downvote, you loose rep)
		}
	});
};

plugin.unvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid, vote.current);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on unvote hook');
			return;
		}


	});
};

module.exports = plugin;
