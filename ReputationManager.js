'use strict';

var db = module.parent.parent.require('./database');

/*
Rules to prevent abuse of the reputation system and reward most valuable users.

 Rule #1 upvoting: user must have
 			- {MIN_POSTS_TO_UPVOTE} posts or more
 			- at least {MIN_DAYS_TO_UPVOTE} days since registration

 Rule #2 downvoting: user must have
 			- {MIN_POSTS_TO_DOWNVOTE} posts or more
 			- at least {MIN_DAYS_TO_DOWNVOTE} since registration
 			- {MIN_REPUTATION_TO_DOWNVOTE} reputation or more

 Rule #3 downvoting costs 1 reputation (user who votes loses 1 reputation)

 Rule #4 one user can't vote more than X times a day, being X = reputation/10. With a minimum of 5 and a max of 50

 Rule #5 reputation can be disabled in certain subforums

 Rule #6 a user cannot vote the same person twice in a month

 Rule #7 a user cannot vote more than 5 messages in the same thread

 Rule #8 upvotes give extra reputation depending on the user who is voting:
 			- extra reputation = floor(voter_reputation/10)

 Rule #9 undoing votes:
 			- undoing an upvote should remove extra reputation awarded when upvote was given (extra rep should not be recalculated)
 			- undoing a downvote should give +1 to voter (and also +1 to post author, but that's something NodeBB already takes cares of)
 */

var MIN_POSTS_TO_UPVOTE = 20;
var MIN_DAYS_TO_UPVOTE = 7;

var MIN_POSTS_TO_DOWNVOTE = 50;
var MIN_DAYS_TO_DOWNVOTE = 15;
var MIN_REPUTATION_TO_DOWNVOTE = 10;

var REP_LOG_NAMESPACE = "reputationLog";

var ReputationManager = function() {
	var _this = this;
	var rules = {};

	this.userCanUpvotePost = function(user, post) {
		if (!hasEnoughPostsToUpvote(user.postcount)) {
			return false;
		}

		if (!isOldEnoughToUpvote(user.joindate)) {
			return false;
		}

		return true;
	};

	this.userCanDownvotePost = function(user, post) {
		if (!hasEnoughPostsToDownvote(user.postcount)) {
			return false;
		}

		if (!isOldEnoughToDownvote(user.joindate)) {
			return false;
		}

		if (!hasEnoughReputationToDownvote(user.reputation)) {
			return false;
		}

		return true;
	};

	this.calculateUpvoteWeight = function(user) {
		var weight = Math.floor(user.reputation/10);
		if (weight<0) weight = 0;
		return weight;
	};

	this.logVote = function(vote, callback) {
		var voteIdentifier = REP_LOG_NAMESPACE + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = false;

		db.setObject(voteIdentifier, vote, function(err) {
			if (err) {
				if (callback) callback(err);
				return;
			}
			if (callback) callback(null, vote);
		});
	};

	this.logVoteUndone = function(vote, callback) {
		var voteIdentifier = REP_LOG_NAMESPACE + ":"
			+ vote.voterId + ":"
			+ vote.authorId + ":"
			+ vote.topicId + ":"
			+ vote.postId;

		vote.undone = true;

		db.setObjectField(voteIdentifier, 'undone', true, function(err) {
			if (err) {
				if (callback) callback(err);
				return;
			}
			if (callback) callback(null, vote);
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
};

function hasEnoughPostsToUpvote(postcount) {
	return postcount > MIN_POSTS_TO_UPVOTE;
}

function isOldEnoughToUpvote(registrationTimestamp) {
	var now = new Date();
	var xDaysAgo = now.getTime() - MIN_DAYS_TO_UPVOTE * 24 * 60 * 60 * 1000;
	return registrationTimestamp < xDaysAgo;
}

function hasEnoughPostsToDownvote(postcount) {
	return postcount > MIN_POSTS_TO_DOWNVOTE;
}

function isOldEnoughToDownvote(registrationTimestamp) {
	var now = new Date();
	var xDaysAgo = now.getTime() - MIN_DAYS_TO_DOWNVOTE * 24 * 60 * 60 * 1000;
	return registrationTimestamp < xDaysAgo;
}

function hasEnoughReputationToDownvote(reputation) {
	return reputation > MIN_REPUTATION_TO_DOWNVOTE;
}

module.exports = ReputationManager;
