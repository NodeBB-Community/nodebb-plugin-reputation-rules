"use strict";

var plugin = {'settingsVersion': '1.1.3'},
    db = require.main.require('./src/database'),
    users = require.main.require('./src/user'),
    meta = require.main.require('./src/meta'),
    Settings = require.main.require('./src/settings'),
    SocketAdmin = require.main.require('./src/socket.io/admin'),

    winston = require.main.require('winston'),

    ReputationParams = require('./ReputationParams'),
    VoteLog = require('./VoteLog'),
    Config = require('./Config.js'),

    ReputationManager = null,
    VoteFilter = null,
    pluginSettings = null;

plugin.onLoad = function (params, callback) {
    ReputationManager = new (require('./ReputationManager'))(Config);
    VoteFilter = new (require('./VoteFilter'))(ReputationManager, users);

    var router = params.router,
        middleware = params.middleware;

    function renderAdmin(req, res, next) {
        res.render('admin/plugins/reputation-rules', {});
    }

    router.get('/admin/plugins/reputation-rules', middleware.admin.buildHeader, renderAdmin);
    router.get('/api/admin/plugins/reputation-rules', renderAdmin);

    SocketAdmin.settings.syncReputationRules = function () {
        pluginSettings.sync(function () {
            winston.info("[reputation-rules] settings updated");
            Config.setSettings(pluginSettings.get());
        });
    };

    var defaultSettings = Config.getSettings();
    pluginSettings = new Settings('reputation-rules', plugin.settingsVersion, defaultSettings, function () {
        winston.info("[reputation-rules] settings loaded");
        Config.setSettings(pluginSettings.get());
        callback();
    });
};

plugin.filterUpvote = function (command, callback) {
    VoteFilter.filterUpvote(command, callback);
};

plugin.filterDownvote = function (command, callback) {
    VoteFilter.filterDownvote(command, callback);
};

plugin.filterUnvote = function (command, callback) {
    VoteFilter.filterUnvote(command, callback);
};

plugin.upvote = function (vote) {
    //winston.info('[hook:upvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    var reputationParams = new ReputationParams(vote.uid, vote.pid);
    reputationParams.recoverParams(function (err, data) {
        if (err) {
            winston.error('[nodebb-reputation-rules] Error on downvote hook');
            return;
        }

        //undo downvote (if needed): remove penalization to the user who downvoted
        if (vote.current === 'downvote') {
            undoDownvote(data.user, data.author, data.post, function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error undoing downvote');
                }
            });
        }

        //calculate extra reputation points (depends on user who votes)
        var extraPoints = ReputationManager.calculateUpvoteWeigh(data.user);

        //give extra points to author!
        increaseUserReputation(data.author.uid, extraPoints, function (err) {
            if (err) {
                winston.error('[nodebb-reputation-rules] Error increasing author\'s reputation on upvote');
                return;
            }

            //log this operation so we can undo it in the future
            var voteLog = new VoteLog(data, extraPoints, 'upvote');
            ReputationManager.logVote(voteLog, function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
                    winston.error(voteLog);
                }
            });

        });
    });
};

plugin.downvote = function (vote) {
    //winston.info('[hook:downvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    var reputationParams = new ReputationParams(vote.uid, vote.pid);
    reputationParams.recoverParams(function (err, data) {
        if (err) {
            winston.error('[nodebb-reputation-rules] Error on downvote hook');
            return;
        }

        //undo upvote (if any): remove author's rep won with the upvote
        if (vote.current === 'upvote') {
            undoUpvote(data.user, data.author, data.post, function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error undoing upvote');
                }
            });
        }

        //and now the downvote:
        // reduce author's reputation by {DOWNVOTE_EXTRA_PERCENTAGE}
        // reduce voter's reputation by {DOWNVOTE_PENALIZATION}
        var extraPoints = ReputationManager.calculateDownvoteWeigh(data.user);
        decreaseUserReputation(data.author.uid, extraPoints, function (err) {
            if (err) {
                winston.error('[nodebb-reputation-rules] Error reducing author\'s reputation on downvote');
            }

            decreaseUserReputation(data.user.uid, Config.downvotePenalization(), function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error reducing voter\'s rep (penalization) on downvote');
                }

                //log this operation so we can undo it in the future
                var voteLog = new VoteLog(data, extraPoints, 'downvote');
                ReputationManager.logVote(voteLog, function (err) {
                    if (err) {
                        winston.error('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
                        winston.error(voteLog);
                    }
                });
            });
        });
    });
};

plugin.unvote = function (vote) {
    //winston.info('[hook:unvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    /* how to undo a vote:
     CASE upvote: reduce author's reputation in case he won extra points when upvoted ({UPVOTE_EXTRA_PERCENTAGE})
     CASE dowvote: increase author's reputation by {DOWNVOTE_EXTRA_PERCENTAGE}
     increase voter's reputation by {DOWNVOTE_PENALIZATION}
     */
    var reputationParams = new ReputationParams(vote.uid, vote.pid);
    reputationParams.recoverParams(function (err, data) {
        if (err) {
            winston.error('[nodebb-reputation-rules] Error on unvote hook');
            return;
        }

        var voteLogIdentifier = {
            'voterId': data.user.uid,
            'authorId': data.author.uid,
            'topicId': parseInt(data.post.tid),
            'postId': data.post.pid
        };

        if (vote.current === 'downvote') {
            undoDownvote(data.user, data.author, data.post, function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error undoing downvote');
                    return;
                }

                ReputationManager.logVoteUndone(voteLogIdentifier, function (err) {
                    if (err) {
                        winston.error('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
                        winston.error(voteLogIdentifier);
                    }
                });
            });
        } else if (vote.current === 'upvote') {
            undoUpvote(data.user, data.author, data.post, function (err) {
                if (err) {
                    winston.error('[nodebb-reputation-rules] Error undoing upvote');
                    return;
                }

                ReputationManager.logVoteUndone(voteLogIdentifier, function (err) {
                    if (err) {
                        winston.error('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
                        winston.error(voteLogIdentifier);
                    }
                });
            });
        }
    });
};

plugin.adminHeader = function (custom_header, callback) {
    custom_header.plugins.push({
        "route": '/plugins/reputation-rules',
        "icon": 'fa-ban',
        "name": 'Reputation Rules'
    });

    callback(null, custom_header);
};

/* ----------------------------------------------------------------------------------- */
function undoUpvote(user, author, post, callback) {
    //find extra vote value
    ReputationManager.findVoteLog(user, author, post, function (err, voteLog) {
        if (err || !voteLog) {
            return callback(err);
        }

        var amount = voteLog.amount;
        //decrease author's rep -extra
        decreaseUserReputation(author.uid, amount, callback);
    });
}

function undoDownvote(user, author, post, callback) {
    //find extra vote value
    ReputationManager.findVoteLog(user, author, post, function (err, voteLog) {
        if (err || !voteLog) {
            return callback(err);
        }

        var amount = voteLog.amount;
        //increase authors's rep
        increaseUserReputation(author.uid, amount, function () {
            //author reputation restored, now how about the voter penalization? must be removed too!
            var penalization = Config.downvotePenalization();
            increaseUserReputation(user.uid, penalization, callback);
        });
    });
}

function decreaseUserReputation(uid, amount, callback) {
    if (amount <= 0) {
        return callback();
    }

    //winston.info("decrease user's reputation (" + uid + ") by " + amount);
    users.decrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
        if (err) {
            callback(err);
            return;
        }

        db.sortedSetAdd('users:reputation', newreputation, uid);

        banUserForLowReputation(uid, newreputation);

        callback();
    });
}

function increaseUserReputation(uid, amount, callback) {
    if (amount <= 0) {
        return callback();
    }

    //winston.info("increase user's reputation (" + uid + ") by " + amount);
    users.incrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
        if (err) {
            callback(err);
            return;
        }

        db.sortedSetAdd('users:reputation', newreputation, uid);

        callback();
    });
}

function banUserForLowReputation(uid, newreputation) {
    if (parseInt(meta.config['autoban:downvote'], 10) === 1 && newreputation < parseInt(meta.config['autoban:downvote:threshold'], 10)) {
        users.getUserField(uid, 'banned', function (err, banned) {
            if (err || parseInt(banned, 10) === 1) {
                return;
            }
            var adminUser = require.main.require('./src/socket.io/admin/user');
            adminUser.banUser(uid, function (err) {
                if (err) {
                    return winston.error(err.message);
                }
                winston.info('uid ' + uid + ' was banned for reaching ' + newreputation + ' reputation');
            });
        });
    }
}

module.exports = plugin;
