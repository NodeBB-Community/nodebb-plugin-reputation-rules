'use strict';

var ReputationManager = function() {
	var _this = this;
	var rules = {};

	this.userCanUpvotePost = function(user, post) {
		return true;
	};

	this.userCanDownvotePost = function(user, post) {
		return true;
	};
};

module.exports = ReputationManager;
