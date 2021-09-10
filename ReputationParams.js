'use strict';

const User = require.main.require('./src/user'),
     Posts = require.main.require('./src/posts');

async function findUser(userId) {
    return await User.getUserData(userId);
}

async function findPost(postId) {
    return await Posts.getPostData(postId);
}

async function findCategory(postId) {
    return await Posts.getCidByPid(postId);
}

async function recoverParams(voterId, postId) {
    try {
        let params = {};
        params.user = await findUser(voterId);
        params.post = await findPost(postId);
        params.author = await findUser(params.post.uid);
        params.post.cid = parseInt(await findCategory(postId), 10);
        return params;
    } catch (err) {
        throw new Error('[nodebb-plugin-reputation-rules] Error retrieving vote data on ReputationParams. ' + err.message);
    }
}

module.exports = {
    recoverParams: recoverParams
};
