'use strict';

var db = require.main.require('./src/database'),
    async = require('async'),
    UserVotingPermissions = require('./UserVotingPermissions.js');

var ReputationManager = function (Config) {
    this.userCanUpvotePost = function (user, post, callback) {
        var userPermissions = new UserVotingPermissions(Config, db, user, post);

        async.series([
                userPermissions.votingAllowedInCategory,
                userPermissions.hasEnoughPostsToUpvote,
                userPermissions.isOldEnoughToUpvote,
                userPermissions.hasVotedTooManyPostsInThread,
                userPermissions.hasVotedAuthorTooManyTimesThisMonth,
                userPermissions.hasVotedTooManyTimesToday,
                userPermissions.postIsNotTooOld
            ],
            function (err) {
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

    this.userCanDownvotePost = function (user, post, callback) {
        var userPermissions = new UserVotingPermissions(Config, db, user, post);

        async.series([
                userPermissions.votingAllowedInCategory,
                userPermissions.hasDownvotedTooManyTimesToday,
                userPermissions.hasEnoughPostsToDownvote,
                userPermissions.isOldEnoughToDownvote,
                userPermissions.hasEnoughReputationToDownvote,
                userPermissions.hasVotedTooManyPostsInThread,
                userPermissions.hasVotedAuthorTooManyTimesThisMonth,
                userPermissions.hasVotedTooManyTimesToday,
                userPermissions.postIsNotTooOld
            ],
            function (err) {
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

    this.calculateUpvoteWeigh = function (user) {
        var extraRate = Config.upvoteExtraPercentage() / 100;
        var weigh = Math.floor(user.reputation * extraRate);
        if (weigh < 0) weigh = 0;
        if (Config.maxUpvoteWeigh() > weigh) {
            weigh = Config.maxUpvoteWeigh();
        }
        return weigh;
    };

    this.calculateDownvoteWeigh = function (user) {
        var extraRate = Config.downvoteExtraPercentage() / 100;
        var weigh = Math.floor(user.reputation * extraRate);
        if (weigh < 0) weigh = 0;
        if (Config.maxDownvoteWeigh() > weigh) {
            weigh = Config.maxDownvoteWeigh();
        }
        return weigh;
    };

    this.logVote = function (vote, callback) {
        vote.undone = false;

        //save main object and its key in secondary sets
        async.series([
                saveMainVoteLog.bind(null, vote),
                saveThreadVoteLog.bind(null, vote),
                saveAuthorVoteLog.bind(null, vote),
                saveUserVoteLog.bind(null, vote)
            ],
            function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, vote);
            });
    };

    this.logVoteUndone = function (vote, callback) {
        vote.undone = true;

        //update main object and remove its key from secondary sets
        async.series([
                updateMainVoteLog.bind(null, vote, 'undone', true),
                removeThreadVoteLog.bind(null, vote),
                removeAuthorVoteLog.bind(null, vote),
                removeUserVoteLog.bind(null, vote)
            ],
            function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, vote);
            });
    };


    this.findVoteLog = function (user, author, post, callback) {
        var voteIdentifier = Config.getMainLogId(user.uid, author.uid, post.tid, post.pid);
        db.getObject(voteIdentifier, function (err, vote) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, vote);
        });
    };

    function saveMainVoteLog(vote, callback) {
        var key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        db.setObject(key, vote, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, vote);
        });
    }

    function updateMainVoteLog(vote, field, value, callback) {
        var key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        db.setObjectField(key, field, value, function (err) {
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

    function saveUserVoteLog(vote, callback) {
        var userKey = Config.getPerUserLogId(vote.voterId);
        var userAndVoteTypeKey = Config.getPerUserAndTypeLogId(vote.voterId, vote.type);
        var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);

        async.series([
                setAdd.bind(null, userKey, value),
                setAdd.bind(null, userAndVoteTypeKey, value)
            ],
            function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, vote);
            });
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

    function removeUserVoteLog(vote, callback) {
        var userKey = Config.getPerUserLogId(vote.voterId);
        var userUpvoteKey = Config.getPerUserAndTypeLogId(vote.voterId, 'upvote');
        var userDownvoteKey = Config.getPerUserAndTypeLogId(vote.voterId, 'downvote');
        var value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);

        async.series([
                setRemove.bind(null, userKey, value),
                setRemove.bind(null, userUpvoteKey, value),
                setRemove.bind(null, userDownvoteKey, value)
            ],
            function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, vote);
            });
    }

    function setAdd(key, value, callback) {
        db.setAdd(key, value, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, value);
        });
    }

    function setRemove(key, value, callback) {
        db.setRemove(key, value, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }
};

module.exports = ReputationManager;
