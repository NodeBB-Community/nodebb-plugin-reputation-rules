# Reputation Rules Plugin for NodeBB

> Rules to prevent abuse of the reputation system and reward most valuable users.

### Rule #1 
**Upvoting** In order to upvote, the user must have  
 - {MIN_POSTS_TO_UPVOTE} posts or more
 - at least {MIN_DAYS_TO_UPVOTE} days since registration

### Rule #2 
**Downvoting** In order to downvote, the user must have  
 - {MIN_POSTS_TO_DOWNVOTE} posts or more
 - at least {MIN_DAYS_TO_DOWNVOTE} since registration
 - {MIN_REPUTATION_TO_DOWNVOTE} reputation or more

### Rule #3 
Downvoting costs 1 reputation (user who votes loses 1 reputation)

### Rule #4 
One user can't vote (up or down) more than `X` times a day, being `X = reputation/10`. With a minimum of 5 and a max of 50

### Rule #5 
Reputation can be disabled in certain subforums

### Rule #6 
A user cannot vote the same person twice in a month

### Rule #7 
A user cannot vote more than 5 messages in the same thread

### Rule #8 
Upvotes give extra reputation depending on the user who is voting:  
 - extra reputation = `floor(voter_reputation/10)`

### Rule #9 
Undoing votes:  
 - undoing an upvote should remove extra reputation awarded when upvote was given (extra rep should not be recalculated)
 - undoing a downvote should give +1 to voter (and also +1 to post author, but that's something NodeBB already takes cares of)

### (TO-DO)
- Ban for low reputation
