"use strict";

var plugin = {},
	User = module.parent.require('./user'),
	Posts = module.parent.require('./posts');

plugin.upvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	User.getUserData(vote.uid, function(err, user) {
		if (err) {
			console.log(err);
			return;
		}

		console.log(user);
	});

	Posts.getPostData(vote.pid, function(err, post) {
		if (err) {
			console.log(err);
			return;
		}

		console.log(post);
	});
};

plugin.downvote = function(vote) {
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	User.getUserData(vote.uid, function(err, user) {
		if (err) {
			console.log(err);
			return;
		}

		console.log(user);
	});

	Posts.getPostData(vote.pid, function(err, post) {
		if (err) {
			console.log(err);
			return;
		}

		console.log(post);
	});
};

module.exports = plugin;
