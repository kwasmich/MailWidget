//object CALL_ON_WAKE is called after wake up
//MAX_SLEEP_TIME is the time which is allowed to pass between two tests
//TESTING_TIME determines how often the computer is polled

function kwasiSleep( CALL_ON_WAKE, MAX_SLEEP_TIME, TESTING_TIME ) {
	var timeToSleep = MAX_SLEEP_TIME;
	var previousTime = new Date();

	function debug( string ) {
		_debug( "kwasiSleep : " + string );
	}

	function getTimedifference() {
		var currentTime = new Date();
		debug( currentTime - previousTime );
		
		if ( ( currentTime - previousTime ) > timeToSleep ) {
			debug( "we fell aspeep" );
			setTimeout( CALL_ON_WAKE, 15000 );
		}
		
		previousTime = currentTime;
	}

//	this.changeMaxSleepTime = function( sleepingTime ) {
//		debug( "timeToSleep set to " + sleepingTime )
//		timeToSleep = sleepingTime;
//	};

	setInterval( getTimedifference, TESTING_TIME );
}
