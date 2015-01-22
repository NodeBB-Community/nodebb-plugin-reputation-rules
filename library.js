"use strict";

var plugin = {},
    db = module.parent.require('./database'),
	winston = require('winston'),
	async = require('async'),
	posts = module.parent.require('./posts'),
	users = module.parent.require('./user'),
	meta = module.parent.require('./meta'),
	ReputationManager = new (require('./ReputationManager'))(),
	ReputationParams = require('./ReputationParams');


plugin.upvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	//TODO if vote.current === 'downvote' hay que deshacer el downvote

	//TODO calculate extra reputation points for post author
};

plugin.downvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	//TODO if vote.current === 'upvote' hay que deshacer el upvote

	//reduce voter's reputation by 1
	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		decreaseUserReputation(vote.uid, 1, function(err) {
			if (err) {
				console.log('[nodebb-reputation-rules] Error on downvote filter hook');
			}
		});
	});
};

plugin.unvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	/* how to undo a vote:
		CASE upvote: reduce author's reputation in case he won extra points when upvoted //TODO
		CASE dowvote: increase voter's reputation by 1
	 */
	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on unvote hook');
			return;
		}

		if (vote.current === 'downvote') {
			undoDownvote(data.user, data.post, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error on upvote filter hook');
				}
			});
		}
	});
};

plugin.filterUpvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on upvote filter hook');
			callback(new Error('[[error:unknowkn-error]]'));
			return;
		}

		if (!ReputationManager.userCanUpvotePost(data.user, data.post)) {
			console.log('[nodebb-reputation-rules] upvote not allowed');
			callback(new Error('[[error:unsufficient-permissions-upvote]]'));
		} else {
			console.log('[nodebb-reputation-rules] upvote allowed');
			callback(null, command);
		}
	});
};

plugin.filterDownvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote filter hook');
			callback(new Error('[[error:unknowkn-error]]'));
			return;
		}

		if (!ReputationManager.userCanDownvotePost(data.user, data.post)) {
			console.log('[nodebb-reputation-rules] downvote not allowed');
			callback(new Error('[[error:unsufficient-permissions-downvote]]'));
		} else {
			console.log('[nodebb-reputation-rules] downvote allowed');
			callback(null, command);
		}
	});
};

plugin.filterUnvote = function(command, callback) {
	console.log('filter.post.unvote');
	console.log(command);

	callback(null, command);
};

function getVoteFromCommand(command) {
	return {
		uid: command.uid,
		pid: command.data.pid,
		tid: command.data.room_id.replace('topic_', '')
	};
}

/* ----------------------------------------------------------------------------------- */
function undoUpvote(user, post, callback) {
	//TODO find exra vote value
	//decrease author's rep -extra
}

function undoDownvote(user, post, callback) {
	increaseUserReputation(user.uid, 1, callback);
}

function decreaseUserReputation(uid, amount, callback) {
	users.decrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
		if (err) {
			return callback(err);
		}

		db.sortedSetAdd('users:reputation', newreputation, uid);

		banUserForLowReputation(uid, newreputation);
	});
}

function increaseUserReputation(uid, amount, callback) {
	users.incrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
		if (err) {
			return callback(err);
		}

		db.sortedSetAdd('users:reputation', newreputation, uid);
	});
}

function banUserForLowReputation(uid, newreputation) {
	if (parseInt(meta.config['autoban:downvote'], 10) === 1 && newreputation < parseInt(meta.config['autoban:downvote:threshold'], 10)) {
		users.getUserField(uid, 'banned', function(err, banned) {
			if (err || parseInt(banned, 10) === 1) {
				return;
			}
			var adminUser = module.parent.require('./socket.io/admin/user');
			adminUser.banUser(uid, function(err) {
				if (err) {
					return winston.error(err.message);
				}
				winston.info('uid ' + uid + ' was banned for reaching ' + newreputation + ' reputation');
			});
		});
	}
}

module.exports = plugin;
