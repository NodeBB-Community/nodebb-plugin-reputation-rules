"use strict";

const winston = require.main.require('winston'),
    ReputationParams = require('./ReputationParams'),
    translator = require('./translator');

function getVoteFromCommand(command) {
    return {
        uid: command.uid,
        pid: command.data.pid,
        tid: command.data.room_id.replace('topic_', '')
    };
}

let VoteFilter = function(ReputationManager, users) {

    this.filterUpvote = async function (command) {
        let vote = getVoteFromCommand(command);
        //winston.info('filter.post.upvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

        let reputationParams = new ReputationParams(vote.uid, vote.pid);
        let data = await reputationParams.recoverParams();
        try {
            await ReputationManager.userCanUpvotePost(data.user, data.post);
            return command;
        } catch (err) {
            let settings = await users.getSettings(data.user.uid);
            if (err.reason) {
                let translated = translator.translate(err.reason, settings.userLang);
                throw new Error(translated);
            } else {
                winston.error('[nodebb-plugin-reputation-rules] Error on upvote filter hook');
                winston.error(err);
                throw err;
            }
        }
    };

    this.filterDownvote = async function (command) {
        let vote = getVoteFromCommand(command);
        //winston.info('filter.post.downvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

        let reputationParams = new ReputationParams(vote.uid, vote.pid);
        let data = await reputationParams.recoverParams();
        try {
            await ReputationManager.userCanDownvotePost(data.user, data.post);
            return command;
        } catch (err) {
            let settings = await users.getSettings(data.user.uid);
            if (err.reason) {
                let translated = translator.translate(err.reason, settings.userLang);
                throw new Error(translated);
            } else {
                winston.error('[nodebb-plugin-reputation-rules] Error on downvote filter hook');
                winston.error(err);
                throw err;
            }
        }
    };

    this.filterUnvote = async function (command) {
        //unvote is always allowed, isn't it?
        //winston.info('filter.post.unvote');

        return command;
    };
};

module.exports = VoteFilter;
