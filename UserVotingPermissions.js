'use strict';

let UserVotingPermissions = function(Config, db, user, post) {
    let _this = this;
    this.user = user;
    this.post = post;

    this.hasEnoughPostsToUpvote = async function() {
        let allowed = _this.user.postcount >= Config.minPostToUpvote();
        if (!allowed) throw {'reason': 'notEnoughPosts'};
    };

    this.isOldEnoughToUpvote = async function() {
        let now = new Date();
        let xDaysAgo = now.getTime() - Config.minDaysToUpvote() * 24 * 60 * 60 * 1000;

        let allowed = _this.user.joindate < xDaysAgo;
        if (!allowed) throw {'reason': 'notOldEnough'};
    };

    this.hasVotedTooManyPostsInThread = async function() {
        let userVotesInThread;
        try {
            userVotesInThread = await countVotesInThread(_this.user.uid, _this.post.tid);
        } catch (err) {
            err.reason = 'Unknown';
            throw err;
        }
        let allowed = userVotesInThread < Config.maxVotesPerUserInThread();
        if (!allowed) throw {'reason': 'tooManyVotesInThread'};
    };

    this.hasVotedAuthorTooManyTimesThisMonth = async function() {
        let votesToAuthor;
        try {
            votesToAuthor = await countVotesToAuthor(_this.user.uid, _this.post.uid);
        } catch (err) {
            err.reason = 'Unknown';
            throw err;
        }
        let allowed = votesToAuthor < Config.maxVotesToSameUserInMonth();
        if (!allowed) throw {'reason': 'tooManyVotesToSameUserThisMonth'};
    };

    this.hasVotedTooManyTimesToday = async function() {
        let votes;
        try {
            votes = await countVotesForUser(_this.user.uid);
        } catch (err) {
            err.reason = 'Unknown';
            throw err;
        }
        let allowed = votes < Config.maxVotesPerUser(_this.user.reputation);
        if (!allowed) throw {'reason': 'tooManyVotesToday'};
    };

    this.hasEnoughPostsToDownvote = async function() {
        let allowed = _this.user.postcount >= Config.minPostToDownvote();
        if (!allowed) throw {'reason': 'notEnoughPosts'};
    };

    this.isOldEnoughToDownvote = async function() {
        let now = new Date();
        let xDaysAgo = now.getTime() - Config.minDaysToDownvote() * 24 * 60 * 60 * 1000;

        let allowed = _this.user.joindate < xDaysAgo;
        if (!allowed) throw {'reason': 'notOldEnough'};
    };

    this.hasEnoughReputationToDownvote = async function() {
        let allowed = _this.user.reputation >= Config.minReputationToDownvote();
        if (!allowed) throw {'reason': 'notEnoughReputation'};
    };

    this.votingAllowedInCategory = async function() {
        let categoryBlackList = Config.getDisabledCategories();
        let index = categoryBlackList.indexOf(_this.post.cid);
        let allowed = index === -1;
        if (!allowed) throw {'reason': 'votingDisabledInCategory'};
    };

    this.postIsNotTooOld = async function() {
        if (Config.getMaxPostAgeDays() === 0) return;

        let now = new Date();
        let postAgeDays = (now - _this.post.timestamp)/24/60/60/1000;
        if (postAgeDays > Config.getMaxPostAgeDays()) throw {'reason': 'postTooOld'};
    };

    this.hasDownvotedTooManyTimesToday = async function() {
        if (Config.maxDownvotesPerDay() === 0) return;

        let downvotes;
        try {
            downvotes = await countDownvotesForUser(_this.user.uid);
        } catch (err) {
            err.reason = 'Unknown';
            throw err;
        }
        let allowed = downvotes < Config.maxDownvotesPerDay();
        if (!allowed) throw {'reason': 'tooManyDownvotesToday'};
    };

    async function countVotesInThread(userId, threadId) {
        let voteIdentifier = Config.getPerThreadLogId(userId, threadId);
        let setMembers = await db.getSetMembers(voteIdentifier);
        return setMembers.length;
    }

    async function countVotesToAuthor(userId, authorId) {
        let voteIdentifier = Config.getPerAuthorLogId(userId, authorId);
        let setMembers = await db.getSetMembers(voteIdentifier);
        return setMembers.length;
    }

    async function countVotesForUser(userId) {
        let voteIdentifier = Config.getPerUserLogId(userId);
        let setMembers = await db.getSetMembers(voteIdentifier);
        return setMembers.length;
    }

    async function countDownvotesForUser(userId) {
        let voteIdentifier = Config.getPerUserAndTypeLogId(userId, 'downvote');
        let setMembers = await db.getSetMembers(voteIdentifier);
        return setMembers.length;
    }
};

module.exports = UserVotingPermissions;
