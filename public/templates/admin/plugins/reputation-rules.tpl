<form id="reputation-rules">
    <div class="settings">

        <div class="row">
            <div class="col-sm-12 col-xs-12">
                <p class="alert alert-info">Remember to <strong>save AND reload</strong> to apply changes to all running instances of NodeBB.</p>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 content-header">
                Contents
            </div>
            <div class="col-sm-10 col-xs-12">
                <nav class="section-content">
                    <ul>
                        <li><a href="#upvoting-permissions">Upvoting Permissions</a></li>
                        <li><a href="#upvotes">Upvotes</a></li>
                        <li><a href="#downvoting-permissions">Downvoting Permissions</a></li>
                        <li><a href="#downvotes">Downvotes</a></li>
                        <li><a href="#global-configuration">Global Configuration</a></li>
                        <li><a href="#save-reload">Save and Reload</a></li>
                    </ul>
                </nav>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="upvoting-permissions"></a>Upvoting Permissions</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <!-- (MIN_POSTS_TO_UPVOTE) -->
                    <label>Minimum amount of posts to upvote:</label>
                    <input class="form-control" type="number" data-key="minPostsToUpvote" title="Minimum posts to upvote">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MIN_DAYS_TO_UPVOTE) -->
                    <label>Minimum amount of days since registration to upvote:</label>
                    <input class="form-control" type="number" data-key="minDaysToUpvote" title="Minimum days to upvote">
                    <br>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="upvotes"></a>Upvotes</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <!-- (UPVOTE_EXTRA_PERCENTAGE) -->
                    <label>Percentage of voter's reputation that is added as extra (upvote weigh):</label>
                    <input class="form-control" type="number" data-key="upvoteExtraPercentage" title="Upvote weigh">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MAX_POINTS_FOR_UPVOTE) -->
                    <label>Max upvote weigh (points):</label>
                    <input class="form-control" type="number" data-key="maxUpvoteWeigh" title="Max upvote points">
                    <br>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="downvoting-permissions"></a>Downvoting Permissions</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <!-- (MIN_POSTS_TO_DOWNVOTE) -->
                    <label>Minimum amount of posts to downvote:</label>
                    <input class="form-control" type="number" data-key="minPostsToDownvote" title="Minimum posts to downvote">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MIN_DAYS_TO_DOWNVOTE) -->
                    <label>Minimum amount of days since registration to downvote:</label>
                    <input class="form-control" type="number" data-key="minDaysToDownvote" title="Minimum days to downvote">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MIN_REPUTATION_TO_DOWNVOTE) -->
                    <label>Minimum amount of reputation to downvote:</label>
                    <input class="form-control" type="number" data-key="minReputationToDownvote" title="Minimum reputation to downvote">
                    <br>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="downvotes"></a>Downvotes</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <!-- (DOWNVOTE_EXTRA_PERCENTAGE) -->
                    <label>Percentage of voter's reputation that is substracted to post author (downvote weigh):</label>
                    <input class="form-control" type="number" data-key="downvoteExtraPercentage" title="Downvote weigh">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (DOWNVOTE_PENALIZATION) -->
                    <label>Downvote penalization (amount of points to remove from user who downvotes):</label>
                    <input class="form-control" type="number" data-key="downvotePenalization" title="Downvote penalization">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MAX_POINTS_FOR_DOWNVOTE) -->
                    <label>Max downvote weigh (points):</label>
                    <input class="form-control" type="number" data-key="maxDownvoteWeigh" title="Max downvote points">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MAX_DOWNVOTES_PER_DAY) -->
                    <label>Max downvotes per user and day (0 to allow unlimited downvotes per day):</label>
                    <input class="form-control" type="number" data-key="maxDownvotesPerDay" title="Max downvotes per day">
                    <br>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="global-configuration"></a>Global Configuration</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <!-- (MAX_VOTES_PER_USER_AND_THREAD) -->
                    <label>Maximum votes allowed per user in a single thread:</label>
                    <input class="form-control" type="number" data-key="maxVotesPerUserInThread" title="Maximum amount of votes per user and thread">
                    <br>
                </div>

                <div class="form-group">
                    <!--(MAX_VOTES_TO_SAME_USER_PER_MONTH)-->
                    <label>Maximum amount of votes allowed to the same user each month:</label>
                    <input class="form-control" type="number" data-key="maxVotesToSameUserInMonth" title="Maximum amount of votes allowed per month to the same user">
                    <br>
                </div>

                <div class="form-group">
                    <!-- (DISABLED_CATEGORIES_IDS) -->
                    <label>Lists of category ids where the reputation system must be disabled:</label>
                    <div data-key="disabledCategoriesIds" data-attributes='{"data-type":"input", "style":"width:80%;margin-bottom:10px;"}' data-split="<br>" data-new='' style="width:100%;"></div>
                    <br>
                </div>

                <div class="form-group">
                    <!-- (MAX_POST_AGE_DAYS) -->
                    <label>Maximum post age, in number of days, to allow votes:</label>
                    <input class="form-control" type="number" data-key="maxPostAgeDays" title="Maximum post age, in number of days, to allow votes">
                    <p class="help-block">Enter zero to disable this and allow votes to any post. Unvotes are ALWAYS allowed.</p>
                    <br>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-2 col-xs-12 settings-header"><a name="save-reload"></a>Save and Reload</div>
            <div class="col-sm-10 col-xs-12">
                <div class="form-group">
                    <div class="col-xs-12 col-md-6 form-group">
                        <button type="button" class="btn btn-success form-control" id="save">
                            <i class="fa fa-fw fa-save"></i> Save Configuration
                        </button>
                    </div>
                    <div class="col-xs-12 col-md-6 form-group">
                        <button type="button" class="btn btn-info form-control" id="reload">
                            <i class="fa fa-fw fa-refresh"></i> Reload NodeBB
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>

</form>

<script type="text/javascript">

require(['settings'], function(settings) {

    settings.sync('reputation-rules', $('#reputation-rules'));

    $('#reset').click( function (event) {
        $('#reputation-rules')[0].reset();
    });

    $('#clear').click( function (event) {
        $('#reputation-rules').find('input').val('');
    });


    var wrapper = $("#reputation-rules");
    settings.sync('reputation-rules', wrapper);
    $('#save').click(function(event){
        event.preventDefault();
        settings.persist('reputation-rules', wrapper, function() {
            socket.emit('admin.settings.syncReputationRules');
        });
    });

    $('#reload').click(function(event) {
        event.preventDefault();
        require(['admin/modules/instance'], function(instance) {
            instance.reload();
        });
    });

});

</script>
