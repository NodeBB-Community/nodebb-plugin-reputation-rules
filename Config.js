var MIN_POSTS_TO_UPVOTE = 20,
    MIN_DAYS_TO_UPVOTE = 7,
    MIN_POSTS_TO_DOWNVOTE = 50,
    MIN_DAYS_TO_DOWNVOTE = 15,
    MIN_REPUTATION_TO_DOWNVOTE = 10,
    MAX_VOTES_PER_USER_AND_THREAD = 5,
    MAX_VOTES_TO_SAME_USER_PER_MONTH = 1,
    REP_LOG_NAMESPACE = "reputationLog";

var Config = {
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
    },
    maxVotesToSameUserInMonth: function() {
        return MAX_VOTES_TO_SAME_USER_PER_MONTH;
    },
    getMainLogId: function(voterId, authorId, topicId, postId) {
        return REP_LOG_NAMESPACE + ":"
            + voterId + ":"
            + authorId + ":"
            + topicId + ":"
            + postId;
    },
    getPerThreadLogId: function(voterId, topicId) {
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":thread:" + topicId;
    },
    getPerAuthorLogId: function(voterId, authorId) {
        var now = new Date();
        var month = now.getMonth() + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":author:" + authorId + ":month:" + month;
    }
};

module.exports = Config;

