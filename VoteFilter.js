"use strict";

var winston = require.main.require('winston'),
    ReputationParams = require('./ReputationParams'),
    translator = require('./translator');

function getVoteFromCommand(command) {
    return {
        uid: command.uid,
        pid: command.data.pid,
        tid: command.data.room_id.replace('topic_', '')
    };
}

var VoteFilter = function(ReputationManager, users) {
    this.filterUpvote = function (command, callback) {
        var vote = getVoteFromCommand(command);
        //winston.info('filter.post.upvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

        var reputationParams = new ReputationParams(vote.uid, vote.pid);
        reputationParams.recoverParams(function (err, data) {
            if (err) {
                winston.error('[nodebb-reputation-rules] Error on upvote filter hook');
                var translated = translator.translate('unknownError', 'en_GB');
                callback(new Error(translated));
                return;
            }

            ReputationManager.userCanUpvotePost(data.user, data.post, function (result) {
                if (!result.allowed) {
                    //winston.info('[nodebb-reputation-rules] upvote not allowed');
                    users.getSettings(data.user.uid, function (err, settings) {
                        var translated = translator.translate(result.reason, settings.userLang);
                        callback(new Error(translated));
                    });
                } else {
                    callback(null, command);
                }
            });
        });
    };

    this.filterDownvote = function (command, callback) {
        var vote = getVoteFromCommand(command);
        //winston.info('filter.post.downvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

        var reputationParams = new ReputationParams(vote.uid, vote.pid);
        reputationParams.recoverParams(function (err, data) {
            if (err) {
                winston.error('[nodebb-reputation-rules] Error on downvote filter hook');
                var translated = translator.translate('unknownError', 'en_GB');
                callback(new Error(translated));
                return;
            }

            ReputationManager.userCanDownvotePost(data.user, data.post, function (result) {
                if (!result.allowed) {
                    //winston.info('[nodebb-reputation-rules] downvote not allowed');
                    users.getSettings(data.user.uid, function (err, settings) {
                        var translated = translator.translate(result.reason, settings.userLang);
                        callback(new Error(translated));
                    });
                } else {
                    callback(null, command);
                }
            });
        });
    };

    this.filterUnvote = function (command, callback) {
        //unvote is always allowed, isn't it?
        //winston.info('filter.post.unvote');

        callback(null, command);
    };
};

module.exports = VoteFilter;
