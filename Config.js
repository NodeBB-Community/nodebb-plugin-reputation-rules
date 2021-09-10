let MIN_POSTS_TO_UPVOTE = 20,
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

let Config = {
    minPostToDownvote() {
        return MIN_POSTS_TO_DOWNVOTE;
    },
    minDaysToDownvote() {
        return MIN_DAYS_TO_DOWNVOTE;
    },
    minReputationToDownvote() {
        return MIN_REPUTATION_TO_DOWNVOTE;
    },
    minPostToUpvote() {
        return MIN_POSTS_TO_UPVOTE;
    },
    minDaysToUpvote() {
        return MIN_DAYS_TO_UPVOTE;
    },
    maxVotesPerUserInThread() {
        return MAX_VOTES_PER_USER_AND_THREAD;
    },
    maxVotesToSameUserInMonth() {
        return MAX_VOTES_TO_SAME_USER_PER_MONTH;
    },
    maxVotesPerUser(reputation) {
        let MIN = 5,
            MAX = 50;
        let calculatedVotesPerUser = Math.floor(reputation / 10);
        if (calculatedVotesPerUser < MIN) {
            calculatedVotesPerUser = MIN;
        } else if (calculatedVotesPerUser > MAX) {
            calculatedVotesPerUser = MAX;
        }
        return calculatedVotesPerUser;
    },
    maxDownvotesPerDay() {
        return MAX_DOWNVOTES_PER_DAY;
    },
    upvoteExtraPercentage() {
        return UPVOTE_EXTRA_PERCENTAGE;
    },
    downvoteExtraPercentage() {
        return DOWNVOTE_EXTRA_PERCENTAGE;
    },
    downvotePenalization() {
        return DOWNVOTE_PENALIZATION;
    },
    maxUpvoteWeight() {
        return MAX_POINTS_FOR_UPVOTE;
    },
    maxDownvoteWeight() {
        return MAX_POINTS_FOR_DOWNVOTE;
    },
    getMainLogId(voterId, authorId, topicId, postId) {
        return REP_LOG_NAMESPACE + ":"
            + voterId + ":"
            + authorId + ":"
            + topicId + ":"
            + postId;
    },
    getPerThreadLogId(voterId, topicId) {
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":thread:" + topicId;
    },
    getPerAuthorLogId(voterId, authorId) {
        let now = new Date();
        let month = (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":author:" + authorId + ":month:" + month;
    },
    getPerUserLogId(voterId) {
        let now = new Date();
        let today = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":day:" + today;
    },
    getPerUserAndTypeLogId(voterId, voteType) {
        let now = new Date();
        let today = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":day:" + today + ':type:' + voteType;
    },
    getDisabledCategories() {
        return DISABLED_CATEGORIES_IDS;
    },
    getMaxPostAgeDays() {
        return MAX_POST_AGE_DAYS;
    },
    getSettings() {
        let settings = {};
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
        settings.maxUpvoteWeight = MAX_POINTS_FOR_UPVOTE;
        settings.maxDownvoteWeight = MAX_POINTS_FOR_DOWNVOTE;
        settings.maxPostAgeDays = MAX_POST_AGE_DAYS;
        return settings;
    },
    setSettings(settings) {
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
        MAX_POINTS_FOR_UPVOTE = settings.maxUpvoteWeight;
        MAX_POINTS_FOR_DOWNVOTE = settings.maxDownvoteWeight;
        MAX_POST_AGE_DAYS = parseInt(settings.maxPostAgeDays, 10) || 0;
    }
};

function intArray(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(arr[i], 10);
    }
    return arr;
}

module.exports = Config;
