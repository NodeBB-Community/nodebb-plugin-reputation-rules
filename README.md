![](https://packages.nodebb.org/api/v1/plugins/nodebb-plugin-reputation-rules/compatibility.png)
[![npm version](https://badge.fury.io/js/nodebb-plugin-reputation-rules.svg?nocache=1)](https://badge.fury.io/js/nodebb-plugin-reputation-rules)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/f8c657b57e2d4664b91b9431b1138acb)](https://www.codacy.com/gh/exo-do/nodebb-plugin-reputation-rules/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=exo-do/nodebb-plugin-reputation-rules&amp;utm_campaign=Badge_Grade)

# Reputation Rules Plugin for NodeBB

> Rules to prevent abuse of the reputation system and reward most valuable users.

![Screenshot](https://raw.githubusercontent.com/exo-do/nodebb-plugin-reputation-rules/master/reputation-rules-acp.png)

## Rules

### Rule #1
**Upvoting** In order to upvote, the user must have  
- `{MIN_POSTS_TO_UPVOTE}` posts or more
- at least `{MIN_DAYS_TO_UPVOTE}` days since registration

### Rule #2
**Downvoting** In order to downvote, the user must have  
- `{MIN_POSTS_TO_DOWNVOTE}` posts or more
- at least `{MIN_DAYS_TO_DOWNVOTE}` since registration
- `{MIN_REPUTATION_TO_DOWNVOTE}` reputation or more

### Rule #3
Downvoting costs `{DOWNVOTE_PENALIZATION}` reputation (user who votes loses some reputation)

### Rule #4
One user can't vote (up or down) more than `X` times a day, being `X = reputation/10`. With a minimum of 5 and a max of 50

### Rule #4.1
One user can't downvote more than 5 times a day. Zero to disable this maximum

### Rule #5
Reputation can be disabled in certain subforums

### Rule #6
A user cannot vote the same person twice in a month

### Rule #7
A user cannot vote more than 5 messages in the same thread

### Rule #8
Upvotes give extra reputation depending on the user who is voting:  
- extra reputation = `floor(votersReputation * 5%)` (you can change this percentage in the ACP)

Downvotes decrease extra reputation depending on the user who is voting:  
- extra reputation = `floor(votersReputation * 5%)` (you can change this percentage in the ACP)

### Rule #9
Undoing votes:  
- undoing an upvote should remove extra reputation awarded when upvote was given (extra rep should not be recalculated)
- undoing a downvote should remove penalization to voter and give the extra reputation the author lost when he got the downvote

### Rule #10
Upvotes and downvotes should have a maximum weight, configurable. So that rule **#8** doesn't make vote points tend to infinity.

### Rule #11
Optional: you can limit upvotes and downvotes to recent posts. In other words, if a message is too old, users won't be able to vote it.
You can configure what "too old" means for you, for example 30 days, 90 days, or 0 if you want to disable this feature and allow votes in old posts.  
**Note** unvotes are always allowed.

## Changelog

v1.2.3

- Added some tests and coverage
- Added more information to error messages when voting

v1.2.2

- Big refactor mainly to use async/await instead of callbacks

v1.2.1

- Fix typos on "weigh"
- Add a section for Rule 4 on the settings panel. It is not configurable but it is a rule that is being applied
- Added explanations for most of the settings so they are easier to understand

v1.2.0

- Updated compatibility to 1.18.2
- Removed the "Reload" button in the ACP as this is no longer needed
- Added debug logs to track down any errors
- Fix: vote max weight was being used as a min, instead of a max
 
