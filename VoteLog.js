"use strict";

module.exports = function(voteParams, extraPoints, type) {
    if (type !== 'upvote' && type !== 'downvote') throw new Error('Vote type unknown: ' + type);

    this.date = new Date();
    this.voterId = voteParams.user.uid;
    this.authorId = voteParams.author.uid;
    this.topicId = parseInt(voteParams.post.tid, 10);
    this.postId = voteParams.post.pid;
    this.type = type;
    this.amount = extraPoints;

    return this;
};
