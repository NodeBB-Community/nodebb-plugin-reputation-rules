const assert = require('assert');
const sinon = require('sinon');
const UserVotingPermissions = require('../UserVotingPermissions');

function daysAgo(days) {
    let now = new Date();
    return now.getTime() - days * 24 * 60 * 60 * 1000;
}

function fiveDaysAgo() {
    return daysAgo(5);
}

function sixtyDaysAgo() {
    return daysAgo(60);
}

describe('UserVotingPermissions', function() {
    describe('#hasEnoughPostsToUpvote()', function() {
        it('should not throw an error when postcount is greater than the configured min posts to upvote', async function() {
            let user = { postcount: 15 };
            let config = {
                minPostToUpvote: sinon.fake.returns(10)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            await permissions.hasEnoughPostsToUpvote();
        });

        it('should throw an error when postcount is less than the configured min posts to upvote', async function() {
            let user = { postcount: 15 };
            let config = {
                minPostToUpvote: sinon.fake.returns(20)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            try {
                await permissions.hasEnoughPostsToUpvote();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'notEnoughPosts');
                assert.deepStrictEqual(err.params, [20]);
            }
        });
    });

    describe('#isOldEnoughToUpvote()', function() {
        it('should not throw an error when user is old enough to upvote', async function() {
            let user = { joindate: fiveDaysAgo() };
            let config = {
                minDaysToUpvote: sinon.fake.returns(2)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            await permissions.isOldEnoughToUpvote();
        });

        it('should throw an error when user is not old enough to upvote', async function() {
            let user = { joindate: fiveDaysAgo() };
            let config = {
                minDaysToUpvote: sinon.fake.returns(6)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            try {
                await permissions.isOldEnoughToUpvote();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'notOldEnough');
                assert.deepStrictEqual(err.params, [6]);
            }
        });
    });

    describe('#hasVotedTooManyPostsInThread()', function() {
        it('should not throw an error when user has not voted too many times in thread', async function() {
            let user = { uid: 1 };
            let post = { tid: 123 };
            let config = {
                maxVotesPerUserInThread: sinon.fake.returns(3),
                getPerThreadLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2'])
            };

            let permissions = new UserVotingPermissions(config, db, user, post);
            await permissions.hasVotedTooManyPostsInThread();
        });

        it('should throw an error when user has voted too many times in thread', async function() {
            let user = { uid: 1 };
            let post = { tid: 123 };
            let config = {
                maxVotesPerUserInThread: sinon.fake.returns(3),
                getPerThreadLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2', 'vote3'])
            };

            let permissions = new UserVotingPermissions(config, db, user, post);
            try {
                await permissions.hasVotedTooManyPostsInThread();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'tooManyVotesInThread');
                assert.deepStrictEqual(err.params, [3]);
            }
        });
    });

    describe('#hasVotedAuthorTooManyTimesThisMonth()', function() {
        it('should not throw an error when user has not voted too many times for this author this month', async function() {
            let user = { uid: 1 };
            let post = { tid: 123 };
            let config = {
                maxVotesToSameUserInMonth: sinon.fake.returns(10),
                getPerAuthorLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2'])
            };

            let permissions = new UserVotingPermissions(config, db, user, post);
            await permissions.hasVotedAuthorTooManyTimesThisMonth();
        });

        it('should throw an error when user has voted too many times for this author this month', async function() {
            let user = { uid: 1 };
            let post = { tid: 123 };
            let config = {
                maxVotesToSameUserInMonth: sinon.fake.returns(10),
                getPerAuthorLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2', 'vote3', 'vote4', 'vote5', 'vote6', 'vote7', 'vote8', 'vote9', 'vote10'])
            };

            let permissions = new UserVotingPermissions(config, db, user, post);
            try {
                await permissions.hasVotedAuthorTooManyTimesThisMonth();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'tooManyVotesToSameUserThisMonth');
                assert.deepStrictEqual(err.params, [10]);
            }
        });
    });

    describe('#hasVotedTooManyTimesToday()', function() {
        it('should not throw an error when user has not voted too many times today', async function() {
            let user = { uid: 1 };
            let config = {
                maxVotesPerUser: sinon.fake.returns(5),
                getPerUserLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2'])
            };

            let permissions = new UserVotingPermissions(config, db, user, null);
            await permissions.hasVotedTooManyTimesToday();
        });

        it('should throw an error when user has voted too many times today', async function() {
            let user = { uid: 1 };
            let config = {
                maxVotesPerUser: sinon.fake.returns(5),
                getPerUserLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2', 'vote3', 'vote4', 'vote5'])
            };

            let permissions = new UserVotingPermissions(config, db, user, null);
            try {
                await permissions.hasVotedTooManyTimesToday();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'tooManyVotesToday');
                assert.deepStrictEqual(err.params, [5]);
            }
        });
    });

    describe('#hasEnoughPostsToDownvote()', function() {
        it('should not throw an error when postcount is greater than the configured min posts to downvote', async function() {
            let user = { postcount: 15 };
            let config = {
                minPostToDownvote: sinon.fake.returns(10)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            await permissions.hasEnoughPostsToDownvote();
        });

        it('should throw an error when postcount is less than the configured min posts to downvote', async function() {
            let user = { postcount: 15 };
            let config = {
                minPostToDownvote: sinon.fake.returns(20)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            try {
                await permissions.hasEnoughPostsToDownvote();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'notEnoughPosts');
                assert.deepStrictEqual(err.params, [20]);
            }
        });
    });

    describe('#isOldEnoughToDownvote()', function() {
        it('should not throw an error when user is old enough to downvote', async function() {
            let user = { joindate: fiveDaysAgo() };
            let config = {
                minDaysToDownvote: sinon.fake.returns(2)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            await permissions.isOldEnoughToDownvote();
        });

        it('should throw an error when user is not old enough to downvote', async function() {
            let user = { joindate: fiveDaysAgo() };
            let config = {
                minDaysToDownvote: sinon.fake.returns(6)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            try {
                await permissions.isOldEnoughToDownvote();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'notOldEnough');
                assert.deepStrictEqual(err.params, [6]);
            }
        });
    });

    describe('#hasEnoughReputationToDownvote()', function() {
        it('should not throw an error when reputation is greater than the configured min to downvote', async function() {
            let user = { reputation: 15 };
            let config = {
                minReputationToDownvote: sinon.fake.returns(10)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            await permissions.hasEnoughReputationToDownvote();
        });

        it('should throw an error when reputation is less than the configured min to downvote', async function() {
            let user = { reputation: 15 };
            let config = {
                minReputationToDownvote: sinon.fake.returns(20)
            };

            let permissions = new UserVotingPermissions(config, null, user, null);
            try {
                await permissions.hasEnoughReputationToDownvote();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'notEnoughReputation');
                assert.deepStrictEqual(err.params, [20]);
            }
        });
    });

    describe('#votingAllowedInCategory()', function() {
        it('should not throw an error when voting is allowed in category', async function() {
            let post = { cid: 456 };
            let config = {
                getDisabledCategories: sinon.fake.returns([])
            };

            let permissions = new UserVotingPermissions(config, null, null, post);
            await permissions.votingAllowedInCategory();
        });

        it('should throw an error when voting is disabled in category', async function() {
            let post = { cid: 456 };
            let config = {
                getDisabledCategories: sinon.fake.returns([123, 456])
            };

            let permissions = new UserVotingPermissions(config, null, null, post);
            try {
                await permissions.votingAllowedInCategory();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'votingDisabledInCategory');
            }
        });
    });

    describe('#postIsNotTooOld()', function() {
        it('should not throw an error when post is not too old', async function() {
            let post = { timestamp: fiveDaysAgo() };
            let config = {
                getMaxPostAgeDays: sinon.fake.returns(30)
            };

            let permissions = new UserVotingPermissions(config, null, null, post);
            await permissions.postIsNotTooOld();
        });

        it('should throw an error when post is too old', async function() {
            let post = { timestamp: sixtyDaysAgo() };
            let config = {
                getMaxPostAgeDays: sinon.fake.returns(30)
            };

            let permissions = new UserVotingPermissions(config, null, null, post);
            try {
                await permissions.postIsNotTooOld();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'postTooOld');
                assert.deepStrictEqual(err.params, [30]);
            }
        });

        it('should not throw an error when disabled (set to zero)', async function() {
            let post = { timestamp: sixtyDaysAgo() };
            let config = {
                getMaxPostAgeDays: sinon.fake.returns(0)
            };

            let permissions = new UserVotingPermissions(config, null, null, post);
            await permissions.postIsNotTooOld();
        });
    });

    describe('#hasDownvotedTooManyTimesToday()', function() {
        it('should not throw an error when user has not downvoted too many times today', async function() {
            let user = { reputation: 15 };
            let config = {
                maxDownvotesPerDay: sinon.fake.returns(5),
                getPerUserAndTypeLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns([])
            };

            let permissions = new UserVotingPermissions(config, db, user, null);
            await permissions.hasDownvotedTooManyTimesToday();
        });

        it('should throw an error when user has downvoted too many times today', async function() {
            let user = { reputation: 15 };
            let config = {
                maxDownvotesPerDay: sinon.fake.returns(5),
                getPerUserAndTypeLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2', 'vote3', 'vote4', 'vote5'])
            };

            let permissions = new UserVotingPermissions(config, db, user, null);
            try {
                await permissions.hasDownvotedTooManyTimesToday();
                assert.fail('expected an error');
            } catch (err) {
                assert.strictEqual(err.reason, 'tooManyDownvotesToday');
                assert.deepStrictEqual(err.params, [5]);
            }
        });

        it('should not throw an error when disabled (set to zero)', async function() {
            let user = { reputation: 15 };
            let config = {
                maxDownvotesPerDay: sinon.fake.returns(0),
                getPerUserAndTypeLogId: sinon.fake.returns('dummyVoteIdentifier')
            };
            let db = {
                getSetMembers: sinon.fake.returns(['vote1', 'vote2', 'vote3', 'vote4', 'vote5'])
            };

            let permissions = new UserVotingPermissions(config, db, user, null);
            await permissions.hasDownvotedTooManyTimesToday();
        });
    });
});
