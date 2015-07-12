'use strict';

var db = module.parent.parent.require('./database');

/*
 #1 para votar positivo necesitas tener 20 mensajes y llevar 7 días registrado (TODO: logros)
 #2 para votar negativo necesitas tener 50 mensajes,  llevar 15 días registrado y tener 10 de reputación
 #3 cada voto negativo te resta 1 de reputación a ti también (un voto negativo siempre cuenta -1)
 #4 un usuario no puede votar más de x veces al día. sea x = reputación/10. con un mínimo de 5 y un máximo de 50
 #5 la reputación no funciona en algunas secciones del foro
 #6 no puedes votar a la misma persona más de 1 vez al mes
 #7 no puedes votar más de 5 mensajes de un mismo hilo
 #8 el valor de un voto positivo depende de la reputación del votante: valor = 1 + floor(reputación/10)
 */

var MIN_POSTS_TO_UPVOTE = 20;
var MIN_DAYS_TO_UPVOTE = 7;

var MIN_POSTS_TO_DOWNVOTE = 50;
var MIN_DAYS_TO_DOWNVOTE = 15;
var MIN_REPUTATION_TO_DOWNVOTE = 10;

var REP_LOG_NAMESPACE = "reputationLog";

var ReputationManager = function() {
	var _this = this;
	var rules = {};

	this.userCanUpvotePost = function(user, post) {
		if (!hasEnoughPostsToUpvote(user.postcount)) {
			return false;
		}

		if (!isOldEnoughToUpvote(user.joindate)) {
			return false;
		}

		return true;
	};

	this.userCanDownvotePost = function(user, post) {
		if (!hasEnoughPostsToDownvote(user.postcount)) {
			return false;
		}

		if (!isOldEnoughToDownvote(user.joindate)) {
			return false;
		}

		if (!hasEnoughReputationToDownvote(user.reputation)) {
			return false;
		}

		return true;
	};

	this.calculateUpvoteWeight = function(user) {
		var weight = Math.floor(user.reputation/10);
		return weight;
	};

	this.saveVoteLog = function(vote, callback) {
		var voteIdentifier = REP_LOG_NAMESPACE + ":" + vote.voterId + ":" + vote.authorId;

		db.setObject(voteIdentifier, vote, function(err) {
			if (err) {
				if (callback) callback(err);
				return;
			}
			if (callback) callback(null, vote);
		});
	};
};

function hasEnoughPostsToUpvote(postcount) {
	return postcount > MIN_POSTS_TO_UPVOTE;
}

function isOldEnoughToUpvote(registrationTimestamp) {
	var now = new Date();
	var xDaysAgo = now.getTime() - MIN_DAYS_TO_UPVOTE * 24 * 60 * 60 * 1000;
	return registrationTimestamp < xDaysAgo;
}

function hasEnoughPostsToDownvote(postcount) {
	return postcount > MIN_POSTS_TO_DOWNVOTE;
}

function isOldEnoughToDownvote(registrationTimestamp) {
	var now = new Date();
	var xDaysAgo = now.getTime() - MIN_DAYS_TO_DOWNVOTE * 24 * 60 * 60 * 1000;
	return registrationTimestamp < xDaysAgo;
}

function hasEnoughReputationToDownvote(reputation) {
	return reputation > MIN_REPUTATION_TO_DOWNVOTE;
}

module.exports = ReputationManager;
