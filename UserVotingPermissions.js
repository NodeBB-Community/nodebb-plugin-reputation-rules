'use strict';

var UserVotingPermissions = function(Config, db, user, post) {
    var _this = this;
    this.user = user;
    this.post = post;

    this.hasEnoughPostsToUpvote = function(callback) {
        var allowed = _this.user.postcount > Config.minPostToUpvote();
        if (!allowed) callback({'reason': 'notEnoughPosts'});
        else callback();
    };

    this.isOldEnoughToUpvote = function(callback) {
        var now = new Date();
        var xDaysAgo = now.getTime() - Config.minDaysToUpvote() * 24 * 60 * 60 * 1000;

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

            var allowed = userVotesInThread < Config.maxVotesPerUserInThread();
            if (!allowed) callback({'reason': 'tooManyVotesInThread'});
            else callback();
        });
    };

    this.hasVotedAuthorTooManyTimesThisMonth = function(callback) {
        countVotesToAuthor(_this.user.uid, _this.post.uid, function(err, votesToAuthor) {
            if (err) {
                err.reason = 'Unknown';
                callback(err);
            }

            var allowed = votesToAuthor < Config.maxVotesToSameUserInMonth();
            if (!allowed) callback({'reason': 'tooManyVotesToSameUserThisMonth'});
            else callback();
        });
    };

    this.hasVotedTooManyTimesToday = function(callback) {
        countVotesForUser(_this.user.uid, function (err, votes) {
            if (err) {
                err.reason = 'Unknown';
                callback(err);
            }

            var allowed = votes < Config.maxVotesPerUser(_this.user.reputation);
            if (!allowed) callback({'reason': 'tooManyVotesToday'});
            else callback();
        });
    };

    this.hasEnoughPostsToDownvote = function(callback) {
        var allowed = _this.user.postcount > Config.minPostToDownvote();
        if (!allowed) callback({'reason': 'notEnoughPosts'});
        else callback();
    };

    this.isOldEnoughToDownvote = function(callback) {
        var now = new Date();
        var xDaysAgo = now.getTime() - Config.minDaysToDownvote() * 24 * 60 * 60 * 1000;

        var allowed = _this.user.joindate < xDaysAgo;
        if (!allowed) callback({'reason': 'notOldEnough'});
        else callback();
    };

    this.hasEnoughReputationToDownvote = function(callback) {
        var allowed = _this.user.reputation > Config.minReputationToDownvote();
        if (!allowed) callback({'reason': 'notEnoughReputation'});
        else callback();
    };

    this.votingAllowedInCategory = function(callback) {
        var categoryBlackList = Config.getDisabledCategories();
        var index = categoryBlackList.indexOf(_this.post.cid);
        var allowed = index === -1;
        if (!allowed) callback({'reason': 'votingDisabledInCategory'});
        else callback();
    };

    function countVotesInThread(userId, threadId, callback) {
        var voteIdentifier = Config.getPerThreadLogId(userId, threadId);
        db.getSetMembers(voteIdentifier, function(err, setMembers) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, setMembers.length);
        });
    }

    function countVotesToAuthor(userId, authorId, callback) {
        var voteIdentifier = Config.getPerAuthorLogId(userId, authorId);
        db.getSetMembers(voteIdentifier, function(err, setMembers) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, setMembers.length);
        });
    }

    function countVotesForUser(userId, callback) {
        var voteIdentifier = Config.getPerUserLogId(userId);
        db.getSetMembers(voteIdentifier, function(err, setMembers) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, setMembers.length);
        });
    }
};

module.exports = UserVotingPermissions;