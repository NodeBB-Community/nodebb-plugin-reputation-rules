'use strict';

const winston = require.main.require('winston'),
    reputationParams = require('./ReputationParams'),
    translator = require('./translator');

function getVoteFromCommand(command) {
    return {
        uid: command.uid,
        pid: command.data.pid,
        tid: command.data.room_id.replace('topic_', '')
    };
}

async function buildParams(command) {
    let vote = getVoteFromCommand(command);
    return await reputationParams.recoverParams(vote.uid, vote.pid);
}

let VoteFilter = function(ReputationManager, users) {

    this.filterUpvote = async function (command) {
        let data = await buildParams(command);
        try {
            await ReputationManager.userCanUpvotePost(data.user, data.post);
            return command;
        } catch (err) {
            if (err.reason) {
                throw new Error(await this.translateError(err, data));
            }

            winston.error('[nodebb-plugin-reputation-rules] Error on upvote filter hook');
            winston.error(err);
            throw err;
        }
    };

    this.filterDownvote = async function (command) {
        let data = await buildParams(command);
        try {
            await ReputationManager.userCanDownvotePost(data.user, data.post);
            return command;
        } catch (err) {
            if (err.reason) {
                throw new Error(await this.translateError(err, data));
            }

            winston.error('[nodebb-plugin-reputation-rules] Error on downvote filter hook');
            winston.error(err);
            throw err;
        }
    };

    this.filterUnvote = async function (command) {
        // unvote is always allowed
        return command;
    };

    this.translateError = async function(err, data) {
        let settings = await users.getSettings(data.user.uid);
        return translator.translate(err.reason, settings.userLang);
    }
};

module.exports = VoteFilter;
