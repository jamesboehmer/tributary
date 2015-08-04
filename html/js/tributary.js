var MAX_LIST_LENGTH = 10;
var SEARCHCLOUD_SOCKJS_ENDPOINT='https://core.fabrik.nytimes.com/endpoints.json';
var SEARCHCLOUD_SOCKJS_DEBUG=false;
var SEARCHCLOUD_FABRIK_COLLECTION='metrics.searchcloud.minute';
var SEARCHCLOUD_FABRIK_HASHKEY='#';
var userDisconnect = false;
var isReconnecting = false;
var lastMessageTime=Date.now();


function appendQueryTerm(queryTerm) {
	var queryListItem = $("<li class='query-list-item'></li>").text(queryTerm.queryTerm);
	if ($('.query-list-item').length >= MAX_LIST_LENGTH) {
		$('.query-list-item').first().remove();
	}
	$('.query-list').append(queryListItem);
}

function setup_socket() {
    if (userDisconnect) return;

    try {
            $.ajax({
                url: SEARCHCLOUD_SOCKJS_ENDPOINT,
                dataType: 'json',
                data: {},
                success: function(data, status, jqXHR) {

                    try{
                        if(socket) socket.close();
                    }
                    catch(ignore){}

                    delete socket;
                    socket = new SockJS(data.http_sockjs_url, null, {'debug':SEARCHCLOUD_SOCKJS_DEBUG});
                    
                    socket.onopen = function(){
                    	// Authenticate
					    if (socket.readyState == SockJS.OPEN) {
					        socket.send(
					        	JSON.stringify(
						        	{
								        'action': 'login',
								        'client_app': 'searchcloud.terms',
								        'user_id': 'search_feedback@nytimes.com',
								        'password': 'we are hiring'
								    }
					        	)
					        );
					    };
					    // subscribe to the query term stream
					    if (socket.readyState == SockJS.OPEN) {
					        socket.send(
					        	JSON.stringify(
									{
								        'action': 'subscribe',
								        'collection': SEARCHCLOUD_FABRIK_COLLECTION,
								        'hash_key': SEARCHCLOUD_FABRIK_HASHKEY
								    }
					        	)
					        );
					    };

                    };

                    socket.onmessage =  function(sockjs_message){
                        appendQueryTerm(JSON.parse(sockjs_message.data.body));
                    };  

                    socket.onclose = function(){
                    };
                },
                timeout: 3000
            })


    } catch (exception) {
        
    }
}

setup_socket();

window.setInterval(function() {
    var rightNow = Date.now();
    if((rightNow-lastMessageTime >=15000) && !userDisconnect && !isReconnecting){
        isReconnecting=true;
        setup_socket();
        isReconnecting=false;
    }
}, 5000);

// play pause buttons
$(".pause-button").on("click",function(){
    if ($(".pause-button-icon").hasClass('glyphicon-play') ) {
        $(".pause-button-icon").removeClass('glyphicon-play').addClass('glyphicon-pause');
        userDisconnect=false;
        setup_socket();

    } else {
        $(".pause-button-icon").removeClass('glyphicon-pause').addClass('glyphicon-play');
        userDisconnect=true;
        socket.close();
    }
});