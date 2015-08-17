var MIN_POSTS_TO_UPVOTE = 20,
    MIN_DAYS_TO_UPVOTE = 7,
    MIN_POSTS_TO_DOWNVOTE = 50,
    MIN_DAYS_TO_DOWNVOTE = 15,
    MIN_REPUTATION_TO_DOWNVOTE = 10,
    MAX_VOTES_PER_USER_AND_THREAD = 5,
    MAX_VOTES_TO_SAME_USER_PER_MONTH = 1,
    REP_LOG_NAMESPACE = "reputationLog",
    DISABLED_CATEGORIES_IDS = [];

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
    maxVotesPerUser: function(reputation) {
        var MIN = 5,
            MAX = 50;
        var calculatedVotesPerUser = Math.floor(reputation/10);
        if (calculatedVotesPerUser < MIN) {
            calculatedVotesPerUser = MIN;
        } else if (calculatedVotesPerUser > MAX) {
            calculatedVotesPerUser = MAX;
        }
        return calculatedVotesPerUser;
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
        var month = (now.getMonth()+1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":author:" + authorId + ":month:" + month;
    },
    getPerUserLogId: function(voterId) {
        var now = new Date();
        var today = now.getDate() + "-" + (now.getMonth()+1) + "-" + now.getFullYear();
        return REP_LOG_NAMESPACE + ":user:" + voterId + ":day:" + today;
    },
    getDisabledCategories: function() {
        return DISABLED_CATEGORIES_IDS;
    },
	getSettings: function(){
		var settings = {};
		settings.minPostsToUpvote = MIN_POSTS_TO_UPVOTE;
		settings.minDaysToUpvote = MIN_DAYS_TO_UPVOTE;
		settings.minPostsToDownvote = MIN_POSTS_TO_DOWNVOTE;
		settings.minDaysToDownvote = MIN_DAYS_TO_DOWNVOTE;
		settings.minReputationToDownvote = MIN_REPUTATION_TO_DOWNVOTE;
		settings.maxVotesPerUserInThread = MAX_VOTES_PER_USER_AND_THREAD;
		settings.maxVotesToSameUserInMonth = MAX_VOTES_TO_SAME_USER_PER_MONTH;
		settings.disabledCategoriesIds = DISABLED_CATEGORIES_IDS;
		settings.repLogNamespace = REP_LOG_NAMESPACE;
		return settings;
	},
	setSettings: function(settings){
		MIN_POSTS_TO_UPVOTE = settings.minPostsToUpvote;
		MIN_DAYS_TO_UPVOTE = settings.minDaysToUpvote;
		MIN_POSTS_TO_DOWNVOTE = settings.minPostsToDownvote;
		MIN_DAYS_TO_DOWNVOTE = settings.minDaysToDownvote;
		MIN_REPUTATION_TO_DOWNVOTE = settings.minReputationToDownvote;
		MAX_VOTES_PER_USER_AND_THREAD = settings.maxVotesPerUserInThread;
		MAX_VOTES_TO_SAME_USER_PER_MONTH = settings.maxVotesToSameUserInMonth;
		DISABLED_CATEGORIES_IDS = intArray(settings.disabledCategoriesIds);
	}
};

function intArray(arr) {
	for(var i=0; i<arr.length; i++) {
		arr[i] = parseInt(arr[i], 10);
	}
	return arr;
}

module.exports = Config;

