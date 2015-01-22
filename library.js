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

	//TODO calculate extra reputation points for post author
};

plugin.downvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	//TODO reduce voter's reputation too
};

plugin.unvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	/* TODO
		1. undo a upvote: reduce author's reputation in case he won extra points when upvoted
		2. undo a dowvote: increase voter's reputation by 1
	 */
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
			callback(null, data);
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
			callback(null, data);
		}
	});
};

plugin.filterUnvote = function(data, callback) {
	console.log('filter.post.unvote');
	console.log(data);

	callback(null, data);
};

function getVoteFromCommand(command) {
	return {
		uid: command.uid,
		pid: command.data.pid,
		tid: command.data.room_id.replace('topic_', '')
	};
}

/* ----------------------------------------------------------------------------------- */
/* -------------------- functions copied from /src/favourites.js --------------------- */
/* ----------------------------------------------------------------------------------- */
function removeVote(user, post, type, callback) {
	//remove vote
	db.sortedSetRemove('uid:' + user.uid + ':upvote', post.pid);
	db.sortedSetRemove('uid:' + user.uid + ':downvote', post.pid);

	//update user reputation and post votes
	users.decrementUserFieldBy(post.uid, 'reputation', 1, function (err, newreputation) {
		if (err) {
			return callback(err);
		}

		db.sortedSetAdd('users:reputation', newreputation, post.uid);

		banUserForLowReputation(post.uid, newreputation);

		var unvote = true;
		adjustPostVotes(post.pid, post.uid, type, unvote, function(err, votes) {
			posts.setPostField(post.pid, 'votes', votes, callback);
		});
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

function adjustPostVotes(pid, uid, type, unvote, callback) {
	var notType = (type === 'upvote' ? 'downvote' : 'upvote');

	async.series([
		function(next) {
			if (unvote) {
				db.setRemove('pid:' + pid + ':' + type, uid, next);
			} else {
				db.setAdd('pid:' + pid + ':' + type, uid, next);
			}
		},
		function(next) {
			db.setRemove('pid:' + pid + ':' + notType, uid, next);
		}
	], function(err) {
		if (err) {
			return callback(err);
		}

		async.parallel({
			upvotes: function(next) {
				db.setCount('pid:' + pid + ':upvote', next);
			},
			downvotes: function(next) {
				db.setCount('pid:' + pid + ':downvote', next);
			}
		}, function(err, results) {
			if (err) {
				return callback(err);
			}
			var voteCount = parseInt(results.upvotes, 10) - parseInt(results.downvotes, 10);

			posts.updatePostVoteCount(pid, voteCount, function(err) {
				callback(err, voteCount);
			});
		});
	});
}

module.exports = plugin;
