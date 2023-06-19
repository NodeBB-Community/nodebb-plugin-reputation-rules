<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
            <form id="reputation-rules">
                <div class="mb-4">
                    <h5 class="fw-bold tracking-tight settings-header">Upvoting</h5>

                    <div class="">
                        <h6>Upvoting Permissions</h6>

                        <div class="mb-3">
                            <!-- (MIN_POSTS_TO_UPVOTE) -->
                            <label class="form-label">Minimum amount of posts to upvote:</label>
                            <input class="form-control" type="number" data-key="minPostsToUpvote" title="Minimum posts to upvote">
                        </div>

                        <div class="mb-3">
                            <!-- (MIN_DAYS_TO_UPVOTE) -->
                            <label class="form-label">Minimum amount of days since registration to upvote:</label>
                            <input class="form-control" type="number" data-key="minDaysToUpvote" title="Minimum days to upvote">
                        </div>

                        <h6>Upvote weight</h6>
                        <div class="mb-3">
                            <!-- (UPVOTE_EXTRA_PERCENTAGE) -->
                            <label class="form-label">Percentage of voter's reputation that is added as extra (upvote weight):</label>
                            <input class="form-control" type="number" data-key="upvoteExtraPercentage" title="Upvote weight">
                            <p class="form-text">This extra is added on top of the +1 that NodeBB gives by default.</p>
                        </div>

                        <div class="mb-3">
                            <!-- (MAX_POINTS_FOR_UPVOTE) -->
                            <label class="form-label">Max upvote weight (points):</label>
                            <input class="form-control" type="number" data-key="maxUpvoteWeight" title="Max upvote points">
                            <p class="form-text">If this max is 10, an upvote will give up to 11 points (1 by default plus 10 extra).</p>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h5 class="fw-bold tracking-tight settings-header">Downvoting</h5>

                    <div class="">
                        <h6>Downvoting Permissions</h6>

                        <div class="mb-3">
                             <!-- (MIN_POSTS_TO_DOWNVOTE) -->
                            <label class="form-label">Minimum amount of posts to downvote:</label>
                            <input class="form-control" type="number" data-key="minPostsToDownvote" title="Minimum posts to downvote">
                        </div>

                        <div class="mb-3">
                            <!-- (MIN_DAYS_TO_DOWNVOTE) -->
                            <label class="form-label">Minimum amount of days since registration to downvote:</label>
                            <input class="form-control" type="number" data-key="minDaysToDownvote" title="Minimum days to downvote">
                        </div>

                        <div class="mb-3">
                            <!-- (MIN_REPUTATION_TO_DOWNVOTE) -->
                            <label class="form-label">Minimum amount of reputation to downvote:</label>
                            <input class="form-control" type="number" data-key="minReputationToDownvote" title="Minimum reputation to downvote">
                        </div>

                        <div class="mb-3">
                            <!-- (MAX_DOWNVOTES_PER_DAY) -->
                            <label class="form-label">Max downvotes per user and day (0 to allow unlimited downvotes per day):</label>
                            <input class="form-control" type="number" data-key="maxDownvotesPerDay" title="Max downvotes per day">
                        </div>

                        <h6>Downvoting weight</h6>
                        <div class="mb-3">
                            <!-- (DOWNVOTE_EXTRA_PERCENTAGE) -->
                            <label class="form-label">Percentage of voter's reputation that is substracted to post author (downvote weight):</label>
                            <input class="form-control" type="number" data-key="downvoteExtraPercentage" title="Downvote weight">
                            <p class="form-text">This extra is subtracted from the author on top of the -1 that NodeBB takes by default.</p>
                            <br>
                        </div>

                        <div class="mb-3">
                            <!-- (MAX_POINTS_FOR_DOWNVOTE) -->
                            <label class="form-label">Max downvote weight (points):</label>
                            <input class="form-control" type="number" data-key="maxDownvoteWeight" title="Max downvote points">
                            <p class="form-text">If this max is 10, a downvote will subtract up to 11 points (1 by default plus 10 extra).</p>
                            <br>
                        </div>

                        <div class="mb-3">
                            <!-- (DOWNVOTE_PENALIZATION) -->
                            <label class="form-label">Downvote penalization (amount of points to remove from user who downvotes):</label>
                            <input class="form-control" type="number" data-key="downvotePenalization" title="Downvote penalization">
                            <p class="form-text">Think of this as the cost of downvoting, so users don't downvote just for fun.</p>
                            <br>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h5 class="fw-bold tracking-tight settings-header">Global configuration</h5>
                    <div class="">
                        <div class="mb-3">
                            <!-- RULE 4 -->
                            <label class="form-label">Maximum votes (up and down) allowed per user and day:</label>
                            <p>The number depends on the formula: <em>votesPerDay = reputation/10</em> with a minimum of 5 votes per day and a max of 50.</p>
                            <p class="form-text">This cannot be changed right now.</p>
                        </div>

                        <div class="mb-3">
                            <!-- (MAX_VOTES_PER_USER_AND_THREAD) -->
                            <label class="form-label">Maximum votes allowed per user in a single thread:</label>
                            <input class="form-control" type="number" data-key="maxVotesPerUserInThread" title="Maximum amount of votes per user and thread">
                        </div>

                        <div class="mb-3">
                            <!--(MAX_VOTES_TO_SAME_USER_PER_MONTH)-->
                            <label class="form-label">Maximum amount of votes allowed to the same user each month:</label>
                            <input class="form-control" type="number" data-key="maxVotesToSameUserInMonth" title="Maximum amount of votes allowed per month to the same user">
                            <p class="form-text">This is to prevent or limit groups of friends trading too many votes.</p>
                            <br>
                        </div>

                        <div class="mb-3">
                            <!-- (DISABLED_CATEGORIES_IDS) -->
                            <label class="form-label">List of category ids where the reputation system must be disabled:</label>
                            <div data-key="disabledCategoriesIds" data-attributes='{"data-type":"input", "style":"width:80%;margin-bottom:10px;"}' data-split="<br>" data-new='' style="width:100%;"></div>
                            <p class="form-text">Some categories might not need the reputation system at all, so you can disable it here.</p>
                            <br>
                        </div>

                        <div class="mb-3">
                            <!-- (MAX_POST_AGE_DAYS) -->
                            <label class="form-label">Maximum post age, in number of days, to allow votes:</label>
                            <input class="form-control" type="number" data-key="maxPostAgeDays" title="Maximum post age, in number of days, to allow votes">
                            <p class="form-text">Enter zero to disable this and allow votes to any post. Unvotes are ALWAYS allowed.</p>
                            <br>
                        </div>
                    </div>
                </div>

            </form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
