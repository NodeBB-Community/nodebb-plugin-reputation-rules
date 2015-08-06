"use strict";

var plugin = {},
    db = module.parent.require('./database'),
	winston = require('winston'),
	users = module.parent.require('./user'),
	meta = module.parent.require('./meta'),
	ReputationManager = new (require('./ReputationManager'))(),
	ReputationParams = require('./ReputationParams');


plugin.upvote = function(vote) {
	console.log('[hook:upvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		//deshacer un posible downvote: devolver +1 al usuario que emite el voto
		if (vote.current === 'downvote') {
			undoDownvote(data.user, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error undoing downvote');
				}
			});
		}

		//calculate extra reputation points (depends on user who votes)
		var extraPoints = ReputationManager.calculateUpvoteWeight(data.user);

		//give extra points to author!
		increaseUserReputation(data.author.uid, extraPoints, function(err) {
			if (err) {
				console.log('[nodebb-reputation-rules] Error increasing author\'s reputation on upvote');
				return;
			}

			//log this operation so we can undo it in the future
			var voteLog = {
				'date': new Date(),
				'voterId': data.user.uid,
				'authorId': data.author.uid,
				'topicId': parseInt(data.post.tid, 10),
				'postId': data.post.pid,
				'type': 'upvote',
				'amount': extraPoints
			};
			ReputationManager.logVote(voteLog, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
					console.dir(voteLog);
				}
			});

		});
	});
};

plugin.downvote = function(vote) {
	console.log('[hook:downvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		//deshacer un posible upvote: quitar al autor del post el "upvote" que le habian dado
		if (vote.current === 'upvote') {
			undoUpvote(data.user, data.author, data.post, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error undoing upvote');
				}
			});
		}

		//and now the downvote: reduce voter's reputation by one
		decreaseUserReputation(vote.uid, 1, function(err) {
			if (err) {
				console.log('[nodebb-reputation-rules] Error on downvote filter hook');
			}

			//log this operation so we can undo it in the future
			var voteLog = {
				'date': new Date(),
				'voterId': data.user.uid,
				'authorId': data.author.uid,
				'topicId': parseInt(data.post.tid),
				'postId': data.post.pid,
				'type': 'downvote',
				'amount': -1
			};
			ReputationManager.logVote(voteLog, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
					console.dir(voteLog);
				}
			});
		});
	});
};

plugin.unvote = function(vote) {
	console.log('[hook:unvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	/* how to undo a vote:
		CASE upvote: reduce author's reputation in case he won extra points when upvoted
		CASE dowvote: increase both user's reputation by 1 (voter and voted user)
	 */
	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on unvote hook');
			return;
		}

		var voteLogIdentifier = {
			'voterId': data.user.uid,
			'authorId': data.author.uid,
			'topicId': parseInt(data.post.tid),
			'postId': data.post.pid
		};

		if (vote.current === 'downvote') {
			undoDownvote(data.user, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error undoing downvote');
					return;
				}

				ReputationManager.logVoteUndone(voteLogIdentifier, function(err) {
					if (err) {
						console.log('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
						console.dir(voteLogIdentifier);
					}
				});
			});
		} else if (vote.current === 'upvote') {
			undoUpvote(data.user, data.author, data.post, function(err) {
				if (err) {
					console.log('[nodebb-reputation-rules] Error undoing upvote');
					return;
				}

				ReputationManager.logVoteUndone(voteLogIdentifier, function(err) {
					if (err) {
						console.log('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
						console.dir(voteLogIdentifier);
					}
				});
			});
		}
	});
};

plugin.filterUpvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on upvote filter hook');
			callback(new Error('[[error:unknowkn-error]]'));
			return;
		}

		ReputationManager.userCanUpvotePost(data.user, data.post, function(result) {
			if (!result.allowed) {
				console.log('[nodebb-reputation-rules] upvote not allowed');
				callback(new Error('[[error:' + result.reason + ']]'));
			} else {
				console.log('[nodebb-reputation-rules] upvote allowed');
				callback(null, command);
			}
		});
	});
};

plugin.filterDownvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	console.log('user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			console.log('[nodebb-reputation-rules] Error on downvote filter hook');
			callback(new Error('[[error:unknowkn-error]]'));
			return;
		}

		ReputationManager.userCanDownvotePost(data.user, data.post, function(result) {
			if (!result.allowed) {
				console.log('[nodebb-reputation-rules] downvote not allowed');
				callback(new Error('[[error:' + result.reason + ']]'));
			} else {
				console.log('[nodebb-reputation-rules] downvote allowed');
				callback(null, command);
			}
		});
	});
};

plugin.filterUnvote = function(command, callback) {
	//unvote is always allowed, isn't it?
	console.log('filter.post.unvote');

	callback(null, command);
};

function getVoteFromCommand(command) {
	return {
		uid: command.uid,
		pid: command.data.pid,
		tid: command.data.room_id.replace('topic_', '')
	};
}

/* ----------------------------------------------------------------------------------- */
function undoUpvote(user, author, post, callback) {
	//find extra vote value
	ReputationManager.findVoteLog(user, author, post, function(err, voteLog) {
		if (err) {
			callback(err);
			return;
		}

		console.dir(voteLog);
		var amount = voteLog.amount;
		//decrease author's rep -extra
		decreaseUserReputation(author.uid, amount, callback);
	});
}

function undoDownvote(user, callback) {
	increaseUserReputation(user.uid, 1, callback);
	//the system will take care of removing the "-1" to the post author
}

function decreaseUserReputation(uid, amount, callback) {
	if (amount >= 0) {
		callback();
		return;
	}

	console.log("decrease user's reputation (" + uid + ") by " + amount);
	users.decrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
		if (err) {
			callback(err);
			return;
		}

		db.sortedSetAdd('users:reputation', newreputation, uid);

		banUserForLowReputation(uid, newreputation);

		callback();
	});
}

function increaseUserReputation(uid, amount, callback) {
	if (amount <= 0) {
		callback();
		return;
	}

	console.log("increase user's reputation (" + uid + ") by " + amount);
	users.incrementUserFieldBy(uid, 'reputation', amount, function (err, newreputation) {
		if (err) {
			callback(err);
			return;
		}

		db.sortedSetAdd('users:reputation', newreputation, uid);

		callback();
	});
}

function banUserForLowReputation(uid, newreputation) {
	if (parseInt(meta.config['autoban:downvote'], 10) === 1 && newreputation < parseInt(meta.config['autoban:downvote:threshold'], 10)) {
		users.getUserField(uid, 'banned', function(err, banned) {
			if (err || parseInt(banned, 10) === 1) {
				return;
			}
			var adminUser = module.parent.require('./socket.io/admin/user');
			adminUser.banUser(uid, function(err) {
				if (err) {
					return winston.error(err.message);
				}
				winston.info('uid ' + uid + ' was banned for reaching ' + newreputation + ' reputation');
			});
		});
	}
}

module.exports = plugin;
