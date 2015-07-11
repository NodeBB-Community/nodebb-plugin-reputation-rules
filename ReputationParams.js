'use strict';

var async = require('async'),
	User = module.parent.parent.require('./user'),
	Posts = module.parent.parent.require('./posts');

var ReputationParams = function(userId, postId) {
	var _this = this;
	this.userId = userId;
	this.postId = postId;
	this.authorId = null;

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

			_this.authorId = post.uid;
			callback(null, post);
		});
	};

	this.findAuthor = function(callback) {
		if (!_this.authorId) {
			callback({message: "findAuthor() error: post.uid missing for postId: " + _this.postId}, null);
			return;
		}

		User.getUserData(_this.authorId, function(err, user) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, user);
		});
	};

	this.recoverParams = function(callback) {
		async.series([
			_this.findUser,
			_this.findPost,
			_this.findAuthor
		], function(err, data) {
			if (err) {
				console.log('[nodebb-reputation-rules] Error on ReputationParams async calls: ' + err.message);
				callback(err);
			}

			var params = {};
			params.user = data[0];
			params.post = data[1];
			params.author = data[2];

			callback(null, params);
		});
	};
};

module.exports = ReputationParams;
