define('admin/plugins/reputation-rules', ['settings'], function(settings) {
	const ACP = {};

	ACP.init = function () {
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
	}

	return ACP;
});
