var MIN_POSTS_TO_UPVOTE = 20,
    MIN_DAYS_TO_UPVOTE = 7,
    MIN_POSTS_TO_DOWNVOTE = 50,
    MIN_DAYS_TO_DOWNVOTE = 15,
    MIN_REPUTATION_TO_DOWNVOTE = 10,
    MAX_VOTES_PER_USER_AND_THREAD = 5,
    MAX_VOTES_TO_SAME_USER_PER_MONTH = 1,
    MAX_DOWNVOTES_PER_DAY = 5, // 0 means disabled
    UPVOTE_EXTRA_PERCENTAGE = 5,
    DOWNVOTE_EXTRA_PERCENTAGE = 5,
    DOWNVOTE_PENALIZATION = 1,
    REP_LOG_NAMESPACE = "reputationLog",
    DISABLED_CATEGORIES_IDS = [],
    MAX_POINTS_FOR_UPVOTE = 10,
    MAX_POINTS_FOR_DOWNVOTE = 10,
    MAX_POST_AGE_DAYS = 0; // 0 means disabled

var Config = {
    minPostToDownvote: function () {
        return MIN_POSTS_TO_DOWNVOTE;
    },
    minDaysToDownvote: function () {
        return MIN_DAYS_TO_DOWNVOTE;
    },
    minReputationToDownvote: function () {
        return MIN_REPUTATION_TO_DOWNVOTE;
    },
    minPostToUpvote: function () {
        return MIN_POSTS_TO_UPVOTE;
    },
    minDaysToUpvote: function () {
        return MIN_DAYS_TO_UPVOTE;
    },
    maxVotesPerUserInThread: function () {
        return MAX_VOTES_PER_USER_AND_THREAD;
    },
    maxVotesToSameUserInMonth: function () {
        return MAX_VOTES_TO_SAME_USER_PER_MONTH;
    },
    maxVotesPerUser: function (reputation) {
        var MIN = 5,
            MAX = 50;
        var calculatedVotesPerUser = Math.floor(reputation / 10);
        if (calculatedVotesPerUser < MIN) {
            calculatedVotesPerUser = MIN;
        } else if (calculatedVotesPerUser > MAX) {
            calculatedVotesPerUser = MAX;
        }
        return calculatedVotesPerUser;
    },
    maxDownvotesPerDay: function () {
        return MAX_DOWNVOTES_PER_DAY;
    },
    upvoteExtraPercentage: function () {
        return UPVOTE_EXTRA_PERCENTAGE;
    },
    downvoteExtraPercentage: function () {
        return DOWNVOTE_EXTRA_PERCENTAGE;
    },
    downvotePenalization: function () {
        return DOWNVOTE_PENALIZATION;
    },
    maxUpvoteWeigh: function () {
        return MAX_POINTS_FOR_UPVOTE;
    },
    maxDownvoteWeigh: function () {
        return MAX_POINTS_FOR_DOWNVOTE;
    },
    getMainLogId: function (voterId, authorId, topicId, postId) {
        return REP_LOG_NAMESPACE + ":"
            + voterId + ":"
            + authorId + ":"
            + topicId + ":"
            + postId;
    },
    getPerThreadLogId: function (voterId, topicId) {
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":thread:" + topicId;
    },
    getPerAuthorLogId: function (voterId, authorId) {
        var now = new Date();
        var month = (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":author:" + authorId + ":month:" + month;
    },
    getPerUserLogId: function (voterId) {
        var now = new Date();
        var today = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":day:" + today;
    },
    getPerUserAndTypeLogId: function (voterId, voteType) {
        var now = new Date();
        var today = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":day:" + today + ':type:' + voteType;
    },
    getDisabledCategories: function () {
        return DISABLED_CATEGORIES_IDS;
    },
    getMaxPostAgeDays: function() {
        return MAX_POST_AGE_DAYS;
    },
    getSettings: function () {
        var settings = {};
        settings.minPostsToUpvote = MIN_POSTS_TO_UPVOTE;
        settings.minDaysToUpvote = MIN_DAYS_TO_UPVOTE;
        settings.minPostsToDownvote = MIN_POSTS_TO_DOWNVOTE;
        settings.minDaysToDownvote = MIN_DAYS_TO_DOWNVOTE;
        settings.minReputationToDownvote = MIN_REPUTATION_TO_DOWNVOTE;
        settings.maxVotesPerUserInThread = MAX_VOTES_PER_USER_AND_THREAD;
        settings.maxVotesToSameUserInMonth = MAX_VOTES_TO_SAME_USER_PER_MONTH;
        settings.maxDownvotesPerDay = MAX_DOWNVOTES_PER_DAY;
        settings.upvoteExtraPercentage = UPVOTE_EXTRA_PERCENTAGE;
        settings.downvoteExtraPercentage = DOWNVOTE_EXTRA_PERCENTAGE;
        settings.downvotePenalization = DOWNVOTE_PENALIZATION;
        settings.disabledCategoriesIds = DISABLED_CATEGORIES_IDS;
        settings.repLogNamespace = REP_LOG_NAMESPACE;
        settings.maxUpvoteWeigh = MAX_POINTS_FOR_UPVOTE;
        settings.maxDownvoteWeigh = MAX_POINTS_FOR_DOWNVOTE;
        settings.maxPostAgeDays = MAX_POST_AGE_DAYS;
        return settings;
    },
    setSettings: function (settings) {
        MIN_POSTS_TO_UPVOTE = settings.minPostsToUpvote;
        MIN_DAYS_TO_UPVOTE = settings.minDaysToUpvote;
        MIN_POSTS_TO_DOWNVOTE = settings.minPostsToDownvote;
        MIN_DAYS_TO_DOWNVOTE = settings.minDaysToDownvote;
        MIN_REPUTATION_TO_DOWNVOTE = settings.minReputationToDownvote;
        MAX_VOTES_PER_USER_AND_THREAD = settings.maxVotesPerUserInThread;
        MAX_VOTES_TO_SAME_USER_PER_MONTH = settings.maxVotesToSameUserInMonth;
        MAX_DOWNVOTES_PER_DAY = settings.maxDownvotesPerDay;
        UPVOTE_EXTRA_PERCENTAGE = settings.upvoteExtraPercentage;
        DOWNVOTE_EXTRA_PERCENTAGE = settings.downvoteExtraPercentage;
        DOWNVOTE_PENALIZATION = settings.downvotePenalization;
        DISABLED_CATEGORIES_IDS = intArray(settings.disabledCategoriesIds);
        MAX_POINTS_FOR_UPVOTE = settings.maxUpvoteWeigh;
        MAX_POINTS_FOR_DOWNVOTE = settings.maxDownvoteWeigh;
        MAX_POST_AGE_DAYS = parseInt(settings.maxPostAgeDays, 10) || 0;
    }
};

function intArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = parseInt(arr[i], 10);
    }
    return arr;
}

module.exports = Config;
