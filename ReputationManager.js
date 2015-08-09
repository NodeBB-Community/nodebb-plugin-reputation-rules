'use strict';

var db = module.parent.parent.require('./database'),
	async = require('async');

var MIN_POSTS_TO_UPVOTE = 20;
var MIN_DAYS_TO_UPVOTE = 7;

var MIN_POSTS_TO_DOWNVOTE = 50;
var MIN_DAYS_TO_DOWNVOTE = 15;
var MIN_REPUTATION_TO_DOWNVOTE = 10;

var MAX_VOTES_PER_THREAD = 5;

var REP_LOG_NAMESPACE = "reputationLog";

var UserVotingPermissions = function(user, post) {
	var _this = this;
	this.user = user;
	this.post = post;

	this.hasEnoughPostsToUpvote = function(callback) {
		var allowed = _this.user.postcount > MIN_POSTS_TO_UPVOTE;
		if (!allowed) callback({'reason': 'notEnoughPosts'});
		else callback();
	};

	this.isOldEnoughToUpvote = function(callback) {
		var now = new Date();
		var xDaysAgo = now.getTime() - MIN_DAYS_TO_UPVOTE * 24 * 60 * 60 * 1000;

		var allowed = _this.user.joindate < xDaysAgo;
		if (!allowed) callback({'reason': 'notOldEnough'});
		else callback();
	};

	this.hasVotedTooManyPostsInThread = function(callback) {
		countVotesInThread(_this.user.uid, _this.post.tid, function(err, userVotesInThread) {
			if (err) {
				err.reason = 'Unknown';
				callback(err);
			}

			var allowed = userVotesInThread >= MAX_VOTES_PER_THREAD;
			if (!allowed) callback({'reason': 'tooManyVotesInThread'});
			else callback();
		});
	};

	this.hasEnoughPostsToDownvote = function(callback) {
		var allowed = _this.user.postcount > MIN_POSTS_TO_DOWNVOTE;
		if (!allowed) callback({'reason': 'notEnoughPosts'});
		else callback();
	};

	this.isOldEnoughToDownvote = function(callback) {
		var now = new Date();
		var xDaysAgo = now.getTime() - MIN_DAYS_TO_DOWNVOTE * 24 * 60 * 60 * 1000;

		var allowed = _this.user.joindate < xDaysAgo;
		if (!allowed) callback({'reason': 'notOldEnough'});
		else callback();
	};

	this.hasEnoughReputationToDownvote = function(callback) {
		var allowed = _this.user.reputation > MIN_REPUTATION_TO_DOWNVOTE;
		if (!allowed) callback({'reason': 'notEnoughPosts'});
		else callback();
	};

	function countVotesInThread(userId, threadId, callback) {
		var voteIdentifier = REP_LOG_NAMESPACE + ":user:" + userId + ":thread:" + threadId;
		db.getSetMembers(voteIdentifier, function(err, setMembers) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, setMembers.length);
		});
	}
};

var ReputationManager = function() {
	var _this = this;

	this.userCanUpvotePost = function(user, post, callback) {
		var userPermissions = new UserVotingPermissions(user, post);

		async.series([
				userPermissions.hasEnoughPostsToUpvote,
				userPermissions.isOldEnoughToUpvote,
				userPermissions.hasVotedTooManyPostsInThread
			],
			function(err, results){
				if (err) {
					callback({
						'allowed': false,
						'reason': err.reason
					});
					return;
				}

				callback({
					'allowed': true
				});
			});
	};

	this.userCanDownvotePost = function(user, post, callback) {
		var userPermissions = new UserVotingPermissions(user, post);

		async.series([
				userPermissions.hasEnoughPostsToDownvote,
				userPermissions.isOldEnoughToDownvote,
				userPermissions.hasEnoughReputationToDownvote
			],
			function(err, results){
				if (err) {
					callback({
						'allowed': false,
						'reason': err.reason
					});
					return;
				}

				callback({
					'allowed': true
				});
			});
	};

	this.calculateUpvoteWeight = function(user) {
		var weight = Math.floor(user.reputation/10);
		if (weight<0) weight = 0;
		return weight;
	};

	this.logVote = function(vote, callback) {
		var mainKey = REP_LOG_NAMESPACE + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = false;

		//save main object and its key in secondary sets
		var threadKey = REP_LOG_NAMESPACE + ":user:" + vote.voterId + ":thread:" + vote.topicId;
		async.series([
				saveMainVoteLog.bind(null, mainKey, vote),
				saveThreadVoteLog.bind(null, threadKey, mainKey)
			],
			function(err, results) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, vote);
			});
	};

	this.logVoteUndone = function(vote, callback) {
		var mainKey = REP_LOG_NAMESPACE + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = true;

		//update main object and remove its key from secondary sets
		var threadKey = REP_LOG_NAMESPACE + ":user:" + vote.voterId + ":thread:" + vote.topicId;
		async.series([
				updateMainVoteLog.bind(null, mainKey, 'undone', true),
				removeThreadVoteLog.bind(null, threadKey, mainKey)
			],
			function(err, results) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, vote);
			});
	};

	this.findVoteLog = function(user, author, post, callback) {
		var voteIdentifier = REP_LOG_NAMESPACE + ":"
			+ user.uid + ":"
			+ author.uid + ":"
			+ post.tid + ":"
			+ post.pid;

		db.getObject(voteIdentifier, function(err, vote) {
			if (err) {
				if (callback) callback(err);
				return;
			}
			if (callback) callback(null, vote);
		});
	};

	function saveMainVoteLog(key, value, callback) {
		db.setObject(key, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, value);
		});
	}

	function updateMainVoteLog(key, field, value, callback) {
		db.setObjectField(key, field, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}

	function saveThreadVoteLog(key, value, callback) {
		db.setAdd(key, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, value);
		});
	}

	function removeThreadVoteLog(key, value, callback) {
		db.setRemove(key, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}
};

module.exports = ReputationManager;
