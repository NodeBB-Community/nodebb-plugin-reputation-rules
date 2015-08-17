"use strict";

var plugin = {},
    db = module.parent.require('./database'),
	winston = require('winston'),
	users = module.parent.require('./user'),
	meta = module.parent.require('./meta'),
	translator = require('./translator'),
	ReputationManager = null,
	ReputationParams = require('./ReputationParams'),
	Settings    = module.parent.require('./settings'),
	SocketAdmin = module.parent.require('./socket.io/admin'),
	Config = require('./Config.js'),
	pluginSettings = null;

plugin.upvote = function(vote) {
	winston.info('[hook:upvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			winston.error('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		//deshacer un posible downvote: devolver +1 al usuario que emite el voto
		if (vote.current === 'downvote') {
			undoDownvote(data.user, function(err) {
				if (err) {
					winston.error('[nodebb-reputation-rules] Error undoing downvote');
				}
			});
		}

		//calculate extra reputation points (depends on user who votes)
		var extraPoints = ReputationManager.calculateUpvoteWeight(data.user);

		//give extra points to author!
		increaseUserReputation(data.author.uid, extraPoints, function(err) {
			if (err) {
				winston.error('[nodebb-reputation-rules] Error increasing author\'s reputation on upvote');
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
					winston.error('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
					winston.error(voteLog);
				}
			});

		});
	});
};

plugin.downvote = function(vote) {
	winston.info('[hook:downvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			winston.error('[nodebb-reputation-rules] Error on downvote hook');
			return;
		}

		//deshacer un posible upvote: quitar al autor del post el "upvote" que le habian dado
		if (vote.current === 'upvote') {
			undoUpvote(data.user, data.author, data.post, function(err) {
				if (err) {
					winston.error('[nodebb-reputation-rules] Error undoing upvote');
				}
			});
		}

		//and now the downvote: reduce voter's reputation by one
		decreaseUserReputation(vote.uid, 1, function(err) {
			if (err) {
				winston.error('[nodebb-reputation-rules] Error on downvote filter hook');
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
					winston.error('[nodebb-reputation-rules] Error saving vote log: ' + err.message);
					winston.error(voteLog);
				}
			});
		});
	});
};

plugin.unvote = function(vote) {
	winston.info('[hook:unvote] user id: ' + vote.uid + ', post id: ' + vote.pid + ', current: ' + vote.current);

	/* how to undo a vote:
		CASE upvote: reduce author's reputation in case he won extra points when upvoted
		CASE dowvote: increase both user's reputation by 1 (voter and voted user)
	 */
	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			winston.error('[nodebb-reputation-rules] Error on unvote hook');
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
					winston.error('[nodebb-reputation-rules] Error undoing downvote');
					return;
				}

				ReputationManager.logVoteUndone(voteLogIdentifier, function(err) {
					if (err) {
						winston.error('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
						winston.error(voteLogIdentifier);
					}
				});
			});
		} else if (vote.current === 'upvote') {
			undoUpvote(data.user, data.author, data.post, function(err) {
				if (err) {
					winston.error('[nodebb-reputation-rules] Error undoing upvote');
					return;
				}

				ReputationManager.logVoteUndone(voteLogIdentifier, function(err) {
					if (err) {
						winston.error('[nodebb-reputation-rules] Error updating vote log: ' + err.message);
						winston.error(voteLogIdentifier);
					}
				});
			});
		}
	});
};

plugin.filterUpvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	winston.info('filter.post.upvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			winston.error('[nodebb-reputation-rules] Error on upvote filter hook');
			var translated = translator.translate('unknownError', 'en_GB');
			callback(new Error(translated));
			return;
		}

		ReputationManager.userCanUpvotePost(data.user, data.post, function(result) {
			if (!result.allowed) {
				winston.info('[nodebb-reputation-rules] upvote not allowed');
				users.getSettings(data.user.uid, function(err, settings) {
					var translated = translator.translate(result.reason, settings.userLang);
					callback(new Error(translated));
				});
			} else {
				callback(null, command);
			}
		});
	});
};

plugin.filterDownvote = function(command, callback) {
	var vote = getVoteFromCommand(command);
	winston.info('filter.post.downvote - user id: ' + vote.uid + ', post id: ' + vote.pid);

	var reputationParams = new ReputationParams(vote.uid, vote.pid);
	reputationParams.recoverParams(function(err, data) {
		if (err) {
			winston.error('[nodebb-reputation-rules] Error on downvote filter hook');
			var translated = translator.translate('unknownError', 'en_GB');
			callback(new Error(translated));
			return;
		}

		ReputationManager.userCanDownvotePost(data.user, data.post, function(result) {
			if (!result.allowed) {
				winston.info('[nodebb-reputation-rules] downvote not allowed');
				users.getSettings(data.user.uid, function(err, settings) {
					var translated = translator.translate(result.reason, settings.userLang);
					callback(new Error(translated));
				});
			} else {
				callback(null, command);
			}
		});
	});
};

plugin.filterUnvote = function(command, callback) {
	//unvote is always allowed, isn't it?
	winston.info('filter.post.unvote');

	callback(null, command);
};

function getVoteFromCommand(command) {
	return {
		uid: command.uid,
		pid: command.data.pid,
		tid: command.data.room_id.replace('topic_', '')
	};
}

plugin.adminHeader = function (custom_header, callback) {
	custom_header.plugins.push({
		"route": '/plugins/reputation-rules',
		"icon": 'fa-ban',
		"name": 'Reputation Rules'
	});

	callback(null, custom_header);
};

plugin.onLoad = function (params, callback) {
	ReputationManager = new (require('./ReputationManager'))(Config);

	var app        = params.app,
		router     = params.router,
		middleware = params.middleware;

	function renderAdmin(req, res, next) {
		res.render('admin/plugins/reputation-rules', {});
	}

	router.get('/admin/plugins/reputation-rules', middleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/reputation-rules', renderAdmin);

	SocketAdmin.settings.syncReputationRules = function () {
		pluginSettings.sync(function() {
			winston.info("[reputation-rules] settings updated");
			Config.setSettings(pluginSettings.get());
		});
	};

	var defaultSettings = Config.getSettings();
	pluginSettings = new Settings('reputation-rules', '0.0.1', defaultSettings, function() {
		winston.info("[reputation-rules] settings loaded");
		Config.setSettings(pluginSettings.get());
		callback();
	});
};

/* ----------------------------------------------------------------------------------- */
function undoUpvote(user, author, post, callback) {
	//find extra vote value
	ReputationManager.findVoteLog(user, author, post, function(err, voteLog) {
		if (err) {
			callback(err);
			return;
		}

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
	if (amount <= 0) {
		return callback();
	}

	winston.info("decrease user's reputation (" + uid + ") by " + amount);
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
		return callback();
	}

	winston.info("increase user's reputation (" + uid + ") by " + amount);
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
