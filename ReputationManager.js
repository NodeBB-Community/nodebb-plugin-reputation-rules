'use strict';

const db = require.main.require('./src/database'),
    winston = require.main.require('winston'),
    UserVotingPermissions = require('./UserVotingPermissions.js');

let ReputationManager = function (Config) {

    this.userCanUpvotePost = async function (user, post) {
        let userPermissions = new UserVotingPermissions(Config, db, user, post);

        try {
            await userPermissions.votingAllowedInCategory();
            await userPermissions.hasEnoughPostsToUpvote();
            await userPermissions.isOldEnoughToUpvote();
            await userPermissions.hasVotedTooManyPostsInThread();
            await userPermissions.hasVotedAuthorTooManyTimesThisMonth();
            await userPermissions.hasVotedTooManyTimesToday();
            await userPermissions.postIsNotTooOld();
            return {
                'allowed': true
            };
        } catch (err) {
            throw {
                'allowed': false,
                'reason': err.reason
            };
        }
    };

    this.userCanDownvotePost = async function (user, post) {
        let userPermissions = new UserVotingPermissions(Config, db, user, post);

        try {
            await userPermissions.votingAllowedInCategory();
            await userPermissions.hasDownvotedTooManyTimesToday();
            await userPermissions.hasEnoughPostsToDownvote();
            await userPermissions.isOldEnoughToDownvote();
            await userPermissions.hasEnoughReputationToDownvote();
            await userPermissions.hasVotedTooManyPostsInThread();
            await userPermissions.hasVotedAuthorTooManyTimesThisMonth();
            await userPermissions.hasVotedTooManyTimesToday();
            await userPermissions.postIsNotTooOld();
            return {
                'allowed': true
            };
        } catch (err) {
            throw {
                'allowed': false,
                'reason': err.reason
            };
        }
    };

    this.calculateUpvoteWeight = function (user) {
        let extraRate = Config.upvoteExtraPercentage() / 100;
        let weight = Math.floor(user.reputation * extraRate);
        if (weight < 0) weight = 0;
        if (weight > Config.maxUpvoteWeight()) {
            weight = Config.maxUpvoteWeight();
        }
        winston.verbose('[plugin-reputation-rules][calculateUpvoteWeight] current voter reputation: ' + user.reputation+ ', upvote extra weight: ' + weight);
        return weight;
    };

    this.calculateDownvoteWeight = function (user) {
        let extraRate = Config.downvoteExtraPercentage() / 100;
        let weight = Math.floor(user.reputation * extraRate);
        if (weight < 0) weight = 0;
        if (weight > Config.maxDownvoteWeight()) {
            weight = Config.maxDownvoteWeight();
        }
        winston.verbose('[plugin-reputation-rules][calculateDownvoteWeight] current voter reputation: ' + user.reputation+ ', downvote extra weight: ' + weight);
        return weight;
    };

    this.logVote = async function (vote) {
        vote.undone = false;
        winston.verbose('[plugin-reputation-rules][logVote] type: ' + vote.type + ', voterId: ' + vote.voterId+ ', authorId: ' + vote.authorId + ', extra amount: ' + vote.amount);

        //save main object and its key in secondary sets
        await saveMainVoteLog(vote);
        await saveThreadVoteLog(vote);
        await saveAuthorVoteLog(vote);
        await saveUserVoteLog(vote);

        return vote;
    };

    this.logVoteUndone = async function (vote) {
        vote.undone = true;
        winston.verbose('[logVoteUndone] voterId: ' + vote.voterId+ ', authorId: ' + vote.authorId);

        //update main object and remove its key from secondary sets
        await updateMainVoteLog(vote, 'undone', true);
        await removeThreadVoteLog(vote);
        await removeAuthorVoteLog(vote);
        await removeUserVoteLog(vote);

        return vote;
    };

    this.findVoteLog = async function (user, author, post) {
        let voteIdentifier = Config.getMainLogId(user.uid, author.uid, post.tid, post.pid);
        return await db.getObject(voteIdentifier);
    };

    async function saveMainVoteLog(vote) {
        let key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await db.setObject(key, vote);
    }

    async function updateMainVoteLog(vote, field, value) {
        let key = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await db.setObjectField(key, field, value);
    }

    async function saveThreadVoteLog(vote) {
        let key = Config.getPerThreadLogId(vote.voterId, vote.topicId);
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await setAdd(key, value);
    }

    async function saveAuthorVoteLog(vote) {
        let key = Config.getPerAuthorLogId(vote.voterId, vote.authorId);
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await setAdd(key, value);
    }

    async function saveUserVoteLog(vote) {
        let userKey = Config.getPerUserLogId(vote.voterId);
        let userAndVoteTypeKey = Config.getPerUserAndTypeLogId(vote.voterId, vote.type);
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);

        await setAdd(userKey, value);
        await setAdd(userAndVoteTypeKey, value);
    }

    async function removeThreadVoteLog(vote) {
        let key = Config.getPerThreadLogId(vote.voterId, vote.topicId);
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await setRemove(key, value);
    }

    async function removeAuthorVoteLog(vote) {
        let key = Config.getPerAuthorLogId(vote.voterId, vote.authorId);
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);
        await setRemove(key, value);
    }

    async function removeUserVoteLog(vote) {
        let userKey = Config.getPerUserLogId(vote.voterId);
        let userUpvoteKey = Config.getPerUserAndTypeLogId(vote.voterId, 'upvote');
        let userDownvoteKey = Config.getPerUserAndTypeLogId(vote.voterId, 'downvote');
        let value = Config.getMainLogId(vote.voterId, vote.authorId, vote.topicId, vote.postId);

        await setRemove(userKey, value);
        await setRemove(userUpvoteKey, value);
        await setRemove(userDownvoteKey, value);
    }

    async function setAdd(key, value) {
        await db.setAdd(key, value);
    }

    async function setRemove(key, value) {
        await db.setRemove(key, value);
    }
};

module.exports = ReputationManager;
