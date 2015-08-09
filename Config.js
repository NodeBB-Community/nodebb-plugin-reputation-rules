var MIN_POSTS_TO_UPVOTE = 20,
    MIN_DAYS_TO_UPVOTE = 7,
    MIN_POSTS_TO_DOWNVOTE = 50,
    MIN_DAYS_TO_DOWNVOTE = 15,
    MIN_REPUTATION_TO_DOWNVOTE = 10,
    MAX_VOTES_PER_USER_AND_THREAD = 5,
    REP_LOG_NAMESPACE = "reputationLog";

var Config = {
    reputationLogNamespace: function() {
        return REP_LOG_NAMESPACE;
    },
    minPostToDownvote: function() {
        return MIN_POSTS_TO_DOWNVOTE;
    },
    minDaysToDownvote: function() {
        return MIN_DAYS_TO_DOWNVOTE;
    },
    minReputationToDownvote: function() {
        return MIN_REPUTATION_TO_DOWNVOTE;
    },
    minPostToUpvote: function() {
        return MIN_POSTS_TO_UPVOTE;
    },
    minDaysToUpvote: function() {
        return MIN_DAYS_TO_UPVOTE;
    },
    maxVotesPerUserInThread: function() {
        return MAX_VOTES_PER_USER_AND_THREAD;
    }
};

module.exports = Config;

