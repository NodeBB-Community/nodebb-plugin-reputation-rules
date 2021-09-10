'use strict';

const User = require.main.require('./src/user'),
     Posts = require.main.require('./src/posts');

let ReputationParams = function (userId, postId) {
    let _this = this;
    this.userId = userId;
    this.postId = postId;
    this.authorId = null;

    this.findUser = async function () {
        return await User.getUserData(_this.userId);
    };

    this.findPost = async function () {
        let post = await Posts.getPostData(_this.postId);
        _this.authorId = post.uid;
        return post;
    };

    this.findAuthor = async function () {
        if (!_this.authorId) {
            throw new Error('findAuthor() error: post.uid missing for postId: ' + _this.postId);
        }

        return await User.getUserData(_this.authorId);
    };

    this.findCategory = async function () {
        return await Posts.getCidByPid(_this.postId);
    };

    this.recoverParams = async function () {
        try {
            let params = {};
            params.user = await this.findUser();
            params.post = await this.findPost();
            params.author = await this.findAuthor();
            params.post.cid = parseInt(await this.findCategory(), 10);
            return params;
        } catch (e) {
            console.log('[nodebb-plugin-reputation-rules] Error retrieving vote data on ReputationParams. ' + err.message);
            throw new Error('[nodebb-plugin-reputation-rules] Error retrieving vote data on ReputationParams. ' + err.message);
        }
    };
};

module.exports = ReputationParams;
