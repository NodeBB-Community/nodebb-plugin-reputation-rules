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
				userPermissions.hasVotedTooManyPostsInThread,
				userPermissions.hasVotedAuthorTooManyTimes
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
		vote.undone = false;

		//save main object and its key in secondary sets
		async.series([
				saveMainVoteLog.bind(null, vote),
				saveThreadVoteLog.bind(null, vote),
				saveAuthorVoteLog.bind(null, vote)
			],
			function(err) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, vote);
			});
	};

	this.logVoteUndone = function(vote, callback) {
		vote.undone = true;

		//update main object and remove its key from secondary sets
		async.series([
				updateMainVoteLog.bind(null, vote, 'undone', true),
				removeThreadVoteLog.bind(null, vote),
				removeAuthorVoteLog.bind(null, vote)
			],
			function(err) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, vote);
			});
	};


	this.findVoteLog = function(user, author, post, callback) {
		var voteIdentifier = Config.getMainLogId(user.uid, author.uid, post.tid, post.pid);
		db.getObject(voteIdentifier, function(err, vote) {
			if (err) {
				if (callback) callback(err);
				return;
			}
			if (callback) callback(null, vote);
		});
	};

	function saveMainVoteLog(vote, callback) {
		var key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		db.setObject(key, vote, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, vote);
		});
	}

	function updateMainVoteLog(vote, field, value, callback) {
		var key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		db.setObjectField(key, field, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}

	function saveThreadVoteLog(vote, callback) {
		var key = Config.getPerThreadLogId(vote.voterId, vote.topicId);
		var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		setAdd(key, value, callback);
	}

	function saveAuthorVoteLog(vote, callback) {
		var key = Config.getPerAuthorLogId(vote.voterId, vote.authorId);
		var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		setAdd(key, value, callback);
	}

	function removeThreadVoteLog(vote, callback) {
		var key = Config.getPerThreadLogId(vote.voterId, vote.topicId);
		var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		setRemove(key, value, callback);
	}

	function removeAuthorVoteLog(vote, callback) {
		var key = Config.getPerAuthorLogId(vote.voterId, vote.authorId);
		var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
		setRemove(key, value, callback);
	}

	function setAdd(key, value, callback) {
		db.setAdd(key, value, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, value);
		});
	}

	function setRemove(key, value, callback) {
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
