'use strict';

var Config = require('./Config.js');

var UserVotingPermissions = function(db, user, post) {
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
        if (!allowed) callback({'reason': 'notEnoughPosts'});
        else callback();
    };

    function countVotesInThread(userId, threadId, callback) {
        var voteIdentifier = Config.reputationLogNamespace() + ":user:" + userId + ":thread:" + threadId;
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