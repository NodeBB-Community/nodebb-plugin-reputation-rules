'use strict';

var db = module.parent.parent.require('./database'),
	async = require('async'),
	Config = require('./Config.js'),
	UserVotingPermissions = require('./UserVotingPermissions.js');

var ReputationManager = function() {
	this.userCanUpvotePost = function(user, post, callback) {
		var userPermissions = new UserVotingPermissions(db, user, post);

		async.series([
				userPermissions.hasEnoughPostsToUpvote,
				userPermissions.isOldEnoughToUpvote,
				userPermissions.hasVotedTooManyPostsInThread
			],
			function(err){
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
		var userPermissions = new UserVotingPermissions(db, user, post);

		async.series([
				userPermissions.hasEnoughPostsToDownvote,
				userPermissions.isOldEnoughToDownvote,
				userPermissions.hasEnoughReputationToDownvote
			],
			function(err){
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
		var mainKey = Config.reputationLogNamespace() + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = false;

		//save main object and its key in secondary sets
		var threadKey = Config.reputationLogNamespace() + ":user:" + vote.voterId + ":thread:" + vote.topicId;
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
		var mainKey = Config.reputationLogNamespace() + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = true;

		//update main object and remove its key from secondary sets
		var threadKey = Config.reputationLogNamespace() + ":user:" + vote.voterId + ":thread:" + vote.topicId;
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
		var voteIdentifier = Config.reputationLogNamespace() + ":"
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
