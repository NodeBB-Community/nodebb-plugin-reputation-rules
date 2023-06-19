'use strict';

let plugin = {'settingsVersion': '1.1.3'},
    db = require.main.require('./src/database'),
    users = require.main.require('./src/user'),
    Settings = require.main.require('./src/settings'),
    SocketAdmin = require.main.require('./src/socket.io/admin'),
    winston = require.main.require('winston'),

    reputationParams = require('./ReputationParams'),
    VoteLog = require('./VoteLog'),
    Config = require('./Config.js'),

    ReputationManager = null,
    VoteFilter = null,
    pluginSettings = null;

plugin.onLoad = function (params, callback) {
    ReputationManager = new (require('./ReputationManager'))(Config);
    VoteFilter = new (require('./VoteFilter'))(ReputationManager, users);

    let router = params.router,
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

    let defaultSettings = Config.getSettings();
    pluginSettings = new Settings('reputation-rules', plugin.settingsVersion, defaultSettings, function () {
        winston.info("[reputation-rules] settings loaded");
        Config.setSettings(pluginSettings.get());
        callback();
    });
};

plugin.filterUpvote = async function (command) {
    winston.verbose('[plugin-reputation-rules][hook:filterUpvote] user id: ' + command.uid + ', post id: ' + command.data.pid);

    return await VoteFilter.filterUpvote(command);
};

plugin.filterDownvote = async function (command) {
    winston.verbose('[plugin-reputation-rules][hook:filterDownvote] user id: ' + command.uid + ', post id: ' + command.data.pid);

    return await VoteFilter.filterDownvote(command);
};

plugin.filterUnvote = async function (command) {
    winston.verbose('[plugin-reputation-rules][hook:filterUnvote] user id: ' + command.uid + ', post id: ' + command.data.pid);

    return await VoteFilter.filterUnvote(command);
};

plugin.upvote = async function (vote) {
    winston.verbose('[plugin-reputation-rules][hook:upvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    try {
        let data = await reputationParams.recoverParams(vote.uid, vote.pid);
        // undo downvote (if needed)
        if (vote.current === 'downvote') {
            await undoDownvote(data.user, data.author, data.post);
        }

        // calculate extra reputation points
        // and give the extra points to the author
        let extraPoints = ReputationManager.calculateUpvoteWeight(data.user);
        await increaseUserReputation(data.author.uid, extraPoints);

        // log this operation so we can undo it in the future
        let voteLog = new VoteLog(data, extraPoints, 'upvote');
        await ReputationManager.logVote(voteLog);
    } catch (err) {
        winston.error('[plugin-reputation-rules] Error on upvote hook', err);
        throw err;
    }
};

plugin.downvote = async function (vote) {
    winston.verbose('[plugin-reputation-rules][hook:downvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    try {
        let data = await reputationParams.recoverParams(vote.uid, vote.pid);
        // undo upvote (if needed)
        if (vote.current === 'upvote') {
            await undoUpvote(data.user, data.author, data.post);
        }

        // calculate weight and reduce author's reputation
        // reduce voter's reputation (cost of downvoting)
        let extraPoints = ReputationManager.calculateDownvoteWeight(data.user);
        await decreaseUserReputation(data.author.uid, extraPoints);
        await decreaseUserReputation(data.user.uid, Config.downvotePenalization());

        //log this operation so we can undo it in the future
        let voteLog = new VoteLog(data, extraPoints, 'downvote');
        await ReputationManager.logVote(voteLog);
    } catch(err) {
        winston.error('[plugin-reputation-rules] Error on downvote hook', err);
        throw err;
    }
};

plugin.unvote = async function (vote) {
    winston.verbose('[plugin-reputation-rules][hook:unvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

    try {
        let data = await reputationParams.recoverParams(vote.uid, vote.pid);

        if (vote.current === 'downvote') {
            await undoDownvote(data.user, data.author, data.post);
        } else if (vote.current === 'upvote') {
            await undoUpvote(data.user, data.author, data.post);
        }

        let voteLogIdentifier = {
            'voterId': data.user.uid,
            'authorId': data.author.uid,
            'topicId': parseInt(data.post.tid),
            'postId': data.post.pid
        };
        await ReputationManager.logVoteUndone(voteLogIdentifier);
    } catch(err) {
        winston.error('[plugin-reputation-rules] Error on unvote hook', err);
        throw err;
    }
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
async function undoUpvote(user, author, post) {
    winston.verbose('[plugin-reputation-rules][undoUpvote] user id: ' + user.uid);

    let voteLog = await ReputationManager.findVoteLog(user, author, post);
    if (!voteLog) {
        winston.verbose('[plugin-reputation-rules] error trying to undo upvote: vote log not found, maybe this vote was casted before the plugin was installed');
        return;
    }

    let amount = voteLog.amount;
    await decreaseUserReputation(author.uid, amount);
}

async function undoDownvote(user, author, post) {
    winston.verbose('[plugin-reputation-rules][undoDownvote] user id: ' + user.uid);

    let voteLog = await ReputationManager.findVoteLog(user, author, post);
    if (!voteLog) {
        winston.verbose('[plugin-reputation-rules] error trying to undo downvote: vote log not found, maybe this vote was casted before the plugin was installed');
        return;
    }

    let amount = voteLog.amount;
    await increaseUserReputation(author.uid, amount);
    //author reputation restored, now remove voter's penalization
    let penalization = Config.downvotePenalization();
    await increaseUserReputation(user.uid, penalization);
}

async function decreaseUserReputation(uid, amount) {
    if (amount <= 0) {
        return;
    }

    winston.verbose("[plugin-reputation-rules][decreaseUserReputation] decrease user's reputation (" + uid + ") by " + amount);
    let newReputation = await users.decrementUserFieldBy(uid, 'reputation', amount);
    await db.sortedSetAdd('users:reputation', newReputation, uid);
}

async function increaseUserReputation(uid, amount) {
    if (amount <= 0) {
        return;
    }

    winston.verbose("[plugin-reputation-rules][increaseUserReputation] increase user's reputation (" + uid + ") by " + amount);
    let newReputation = await users.incrementUserFieldBy(uid, 'reputation', amount);
    await db.sortedSetAdd('users:reputation', newReputation, uid);
}

module.exports = plugin;
