'use strict';

var async = require('async'),
    User = require.main.require('./src/user'),
    Posts = require.main.require('./src/posts');

var ReputationParams = function (userId, postId) {
    var _this = this;
    this.userId = userId;
    this.postId = postId;
    this.authorId = null;

    this.findUser = function (callback) {
        User.getUserData(_this.userId, function (err, user) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, user);
        });
    };

    this.findPost = function (callback) {
        Posts.getPostData(_this.postId, function (err, post) {
            if (err) {
                callback(err);
                return;
            }

            _this.authorId = post.uid;
            callback(null, post);
        });
    };

    this.findAuthor = function (callback) {
        if (!_this.authorId) {
            callback({message: "findAuthor() error: post.uid missing for postId: " + _this.postId}, null);
            return;
        }

        User.getUserData(_this.authorId, function (err, user) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, user);
        });
    };

    this.findCategory = function (callback) {
        Posts.getCidByPid(_this.postId, function (err, cid) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, cid);
        });
    };

    this.recoverParams = function (callback) {
        async.series([
            _this.findUser,
            _this.findPost,
            _this.findAuthor,
            _this.findCategory
        ], function (err, data) {
            if (err) {
                console.log('[nodebb-reputation-rules] Error on ReputationParams async calls: ' + err.message);
                callback(err);
            }

            var params = {};
            params.user = data[0];
            params.post = data[1];
            params.author = data[2];
            params.post.cid = parseInt(data[3], 10);

            callback(null, params);
        });
    };
};

module.exports = ReputationParams;
