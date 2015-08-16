<form id="reputation-rules">
    <div class="row">
        <div class="col-lg-9">
            <div class="panel acp-panel-primary">
                <div class="panel-body">
				    <h3>Reputation Rules Plugin</h3>
					<p>This plugin lets you configure the parameters to manage the reputation system in your nodebb instance.</p>
					<p>Here you can set the values to change the reputation system behaviour.</p>

                    <div class="form-group">
                        <!-- (MIN_POSTS_TO_UPVOTE) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Minimum Amount of posts written in the forum in order to be capable of upvote a post by an user:</label>
                            <input class="form-control" type="number" data-key="minPostToUpvote" title="Minimum Post Number to Upvote">
                        </div>
                        <!-- (MIN_DAYS_TO_UPVOTE) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Amount of days that an account have to be old in order to upvote:</label>
                            <input class="form-control" type="number" data-key="minDaysToUpvote" title="Minimum Days to Upvote">
                        </div>
                        <!-- (MIN_POSTS_TO_DOWNVOTE) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Minimum Amount of posts written in the forum in order to be capable of downvote a post:</label>
                            <input class="form-control" type="number" data-key="minPostToDownvote" title="Minimum Posts to Downvote">
                        </div>
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Minimum amount of days old an acount must have in order to downvote posts :</label>
                            <input class="form-control" type="number" data-key="minDaysToDownvote" title="Minimum Days to Downvote">
                        </div>
                        <!-- (MIN_DAYS_TO_DOWNVOTE) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Minimum amount of reputation an user must have in order to downvote a post:</label>
                            <input class="form-control" type="number" data-key="minReputationToDownvote" title="Minimum Reputation to Downvote">
                        </div>
                        <!-- (MAX_VOTES_PER_USER_AND_THREAD) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Maximum votes allowed per user and thread :</label>
                            <input class="form-control" type="number" data-key="maxVotesPerUserInThread" title="Maximum amount of votes per user and thread">
                        </div>
                        <!--(MAX_VOTES_TO_SAME_USER_PER_MONTH)-->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Amount of votes allowed to the same user each month:</label>
                            <input class="form-control" type="number" data-key="maxVotesToSameUserInMonth" title="Maximum amount of votes allowed per month to the same user">
                        </div>
                        <!-- (REP_LOG_NAMESPACE) -->
                        <!--<div class="col-xs-12 col-md-6 form-group">
                            <label>Name of the reputation log namespace:</label>
                            <input class="form-control" type="text" data-key="repLogNamespace" title="Namespace of reputation log">
                        </div>-->
                        <!-- (DISABLED_CATEGORIES_IDS) -->
                        <div class="col-xs-12 col-md-6 form-group">
                            <label>Lists of category ids where the reputation system must be disabled:</label>
                            <div data-key="disabledCategoriesIds" data-attributes='{"data-type":"input", "style":"width:80%;margin-bottom:10px;"}' data-split="<br>" data-new='' style="width:100%;"></div>
                            <!--<input class="form-control" type="text" data-key="disabledCategoriesIds" title="Lists disabled categories">-->
                        </div>
                    </div>
					<div class="form-group">
                        <button type="button" class="btn btn-success form-control" id="save">
                            <i class="fa fa-fw fa-save"></i> Save Configuration
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

});

</script>
