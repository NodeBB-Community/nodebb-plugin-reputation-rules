'use strict';

var async = require('async'),
	User = module.parent.parent.require('./user'),
	Posts = module.parent.parent.require('./posts');

var ReputationParams = function(userId, postId) {
	var _this = this;
	this.userId = userId;
	this.postId = postId;

	this.findUser = function(callback) {
		User.getUserData(_this.userId, function(err, user) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, user);
		});
	};

	this.findPost = function(callback) {
		Posts.getPostData(_this.postId, function(err, post) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, post);
		});
	};

	this.recoverParams = function(callback) {
		async.series([
			_this.findUser,
			_this.findPost
		], function(err, data) {
			if (err) {
				console.log('[nodebb-reputation-rules] Error on ReputationParams async calls: ' + err.message);
				callback(err);
			}

			var params = {};
			params.user = data[0];
			params.post = data[1];

			callback(null, params);
		});
	};
};

module.exports = ReputationParams;
