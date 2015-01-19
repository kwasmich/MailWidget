//ACTIVE_ACCOUNT must be an object of type Account
//REPORT_COUNT must be of type theCounter( mailCount )
//LAST_MAIL must be of type theLastMail( sender, subject, date )
//FAIL( ACTIVE_ACCOUNT ) is called on errors
//DONE( ACTIVE_ACCOUNT ) is called on finished communication
//public commands are void checkMail() and void kill()
//please call kill() on removing

function kwasiImapClient( ACTIVE_ACCOUNT, REPORT_COUNT, LAST_MAIL, FAIL, DONE ) {
	var serverConnection;
	var state = "";
	var stateCount = 0;
	var ready = true;
	var timeoutCounter;
	var retryTimer;
	
	function debug( STRING ) {
		_debug( "kwasiImapClient : " + STRING );
	}
	
	this.checkMail = function() {
		debug( "checkMail()" );
		
		this.kill();
		connect();
	};
	
	this.kill = function() {
		debug( "kill()" );
		
		if ( !ready ) {
			cancel();
		}
		
		clearTimeout( retryTimer );
	};
	
	function retry() {
		debug( "retry()" );
		
		if ( ACTIVE_ACCOUNT.newLine == "\r\n" ) {
			debug( "communication error. retrying with different line ending" );
			cancel();
			ACTIVE_ACCOUNT.newLine = "\n";
			retryTimer = setTimeout( connect, 5000 );
		} else {
			ACTIVE_ACCOUNT.newLine = "\r\n";
			cancel();
			DONE( ACTIVE_ACCOUNT );
			FAIL( ACTIVE_ACCOUNT );
		}
	}
	
	function failure() {
		logout();
		ACTIVE_ACCOUNT.newLine = "\n";
		FAIL( ACTIVE_ACCOUNT );
	}
	
	function forceDisconnect() {
		ACTIVE_ACCOUNT.newLine = "\n";
		cancel();
		DONE( ACTIVE_ACCOUNT );
		FAIL( ACTIVE_ACCOUNT );
	}
	
	function connect() {
		debug( "connect()" );
	
		//timeoutCounter = setTimeout( retry, 30000 );
		stateCount = 0;
		state = "";
		ready = false;
		
		if ( ACTIVE_ACCOUNT.SSLEnabled ) {
			debug( "/usr/bin/openssl s_client -connect " + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber );
			serverConnection = widget.system( "/usr/bin/openssl s_client -connect " + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber, imapEndHandler );
		} else {
			debug( "/usr/bin/nc " + ACTIVE_ACCOUNT.Hostname + " " + ACTIVE_ACCOUNT.PortNumber );
			serverConnection = widget.system( "/usr/bin/nc " + ACTIVE_ACCOUNT.Hostname + " " + ACTIVE_ACCOUNT.PortNumber, imapEndHandler );
		}
		
		serverConnection.onreaderror = errorHandler;
		serverConnection.onreadoutput = imapHandler;
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function login() {
		debug( "login()" );
		
		stateCount = 1;
		state = "";
		//debug( "sending : a01 LOGIN " + ACTIVE_ACCOUNT.Username + " " + ACTIVE_ACCOUNT.Password );
		var userName = ACTIVE_ACCOUNT.Username;
		userName = userName.replace( new RegExp( "\\\\", "g" ), "\\\\" );
		userName = userName.replace( new RegExp( "\\\"", "g" ), "\\\"" );
		var passWord = ACTIVE_ACCOUNT.Password;
		passWord = passWord.replace( new RegExp( "\\\\", "g" ), "\\\\" );
		passWord = passWord.replace( new RegExp( "\\\"", "g" ), "\\\"" );
		debug( "sending : a01 LOGIN \"" + userName + "\" \"PASSWORD\"" );
		serverConnection.write( "a01 LOGIN \"" + userName + "\" \"" + passWord + "\"" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function cramMD5() {
		debug( "cramMD5()" );
	
		stateCount = 2;
		state = "";
		debug( "sending : a01 AUTHENTICATE CRAM-MD5" );
		serverConnection.write( "a01 AUTHENTICATE CRAM-MD5" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function cramMD5Response( SERVER_RESPONSE ) {
		debug( "cramMD5Response()" );
		
		stateCount = 3;
		state = "";
		var clientResponse = btoa( ACTIVE_ACCOUNT.Username + " " + hex_hmac_md5( ACTIVE_ACCOUNT.Password, SERVER_RESPONSE ) );
		debug( "sending : " + clientResponse );
		serverConnection.write( clientResponse + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
		
	function select() {
		debug( "select()" );
	
		stateCount = 4;
		state = "";
		debug( "sending : a02 SELECT \"INBOX\"" );
		serverConnection.write( "a02 SELECT \"INBOX\"" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function fetch() {
		debug( "fetch()" );
		
		stateCount = 5;
		state = "";
		debug( "sending : a03 FETCH 1:* (UID FLAGS)" );
		serverConnection.write( "a03 FETCH 1:* (UID FLAGS)" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function fetchHeader( MESSAGE ) {
		debug( "fetchHeader( " + MESSAGE + " )" );
		
		stateCount = 6;
		state = "";
		debug( "sending : a04 FETCH " + MESSAGE + " RFC822.HEADER" );
		serverConnection.write( "a04 FETCH " + MESSAGE + " RFC822.HEADER" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function logout() {
		debug( "logout()" );
		
		stateCount = 7;
		state = "";
		debug( "sending : a05 LOGOUT" );
		serverConnection.write( "a05 LOGOUT" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
    
    function postLogout() {
		debug( "postLogout()" );
		
		stateCount = 8;
		state = "";
		debug( ACTIVE_ACCOUNT.newLine );
		serverConnection.write( ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function cancel() {
		debug( "cancel()" );
		
		serverConnection.cancel();
		ready = true;
		clearTimeout( timeoutCounter );
	}
	
	function imapEndHandler( RESULT ) {
		debug( "imapEndHandler( " + RESULT + " )" );
		
		ready = true;
		clearTimeout( timeoutCounter );
		
		if ( stateCount < 7 ) {
			FAIL( ACTIVE_ACCOUNT );
		} else {
			DONE( ACTIVE_ACCOUNT );
		}
	}
	
	function errorHandler( RESULT ) {
		debug( "errorHandler( " + RESULT + " )" );
	}
		
	function imapHandler( RESULT ) {
		debug( "imapHandler( RESULT )" );
		debug( "imapHandler : " + stateCount );
		
		clearTimeout( timeoutCounter );
/*	
		if ( stateCount < 4 ) {
			timeoutCounter = setTimeout( retry, 5000 );
		} else {
			timeoutCounter = setTimeout( failure, 10000 );
		}
*/				
		switch ( stateCount ) {
			case 0:	connectHandler( RESULT );
					break;
			case 1:	loginHandler( RESULT );
					break;
			case 2: cramMD5Handler( RESULT );
					break;
			case 3: cramMD5ResponseHandler( RESULT );
					break;
			case 4:	selectHandler( RESULT );
					break;
			case 5:	fetchHandler( RESULT );
					break;
			case 6:	fetchHeaderHandler( RESULT );
					break;
			case 7:	logoutHandler( RESULT );
					break;
            case 8:	postLogoutHandler( RESULT );
					break;
			default:
		}
	}

	function connectHandler( RESULT ) {
		debug( "connectHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( state.indexOf( "* OK" ) != -1 ) {
			debug( "connectHandler : we are connected" );
			
			if ( ACTIVE_ACCOUNT.AuthenticationScheme == "CRAM-MD5" ) {
				cramMD5();
			} else {
				login();
			}
		}
	}

	function loginHandler( RESULT ) {
		debug( "loginHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a01 BAD" ) != -1 ) || ( state.indexOf( "* BAD" ) != -1 ) ) {
			retry();
		} else if ( state.indexOf( "a01 NO" ) != -1 ) {
			debug( "we are unable to login" );
			retry();
			//failure();
		}
		
		if ( state.indexOf( "a01 OK" ) != -1 ) {
			debug( "loginHandler : we are connected" );
			select();
		}
	}

	function cramMD5Handler( RESULT ) {
		debug( "cramMD5Handler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a01 BAD" ) != -1 ) || ( state.indexOf( "* BAD" ) != -1 ) ) {
			retry();
		} else if ( state.indexOf( "a01 NO" ) != -1 ) {
			debug( "we are unable to cram-md5" );
			retry();
			//failure();
		}
		
		if ( state.indexOf( "+ " ) != -1 ) {
            var str = state.split( " " )[1];
            str = str.replace( new RegExp( "[^A-Za-z0-9/=\\+]", "g" ), "" );
			cramMD5Response( atob( str ) );
		} else {
			debug( "no CRAM-MD5 ?" );
			failure();
		}
	}

	function cramMD5ResponseHandler( RESULT ) {
		debug( "cramMD5ResponseHandler : " + RESULT );
		state += RESULT;
		
		if ( ( state.indexOf( "a01 BAD" ) != -1 ) || ( state.indexOf( "a01 NO" ) != -1 )  || ( state.indexOf( "* BAD" ) != -1 ) ) {
			debug( "we are unable to cram-md5" );
			failure();
		}
		
		if ( state.indexOf( "a01 OK" ) != -1 ) {
			debug( "cramMD5ResponseHandler : okay" );
			select();
		}
	}

	function selectHandler( RESULT ) {
		debug( "selectHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a02 BAD" ) != -1 ) || ( state.indexOf( "a02 NO" ) != -1 ) ) {
			debug( "we are unable to select" );
			failure();
		}
		
		if ( state.indexOf( "a02 OK" ) != -1 ) {
			debug( "selectHandler : successfull selected" );
			var exists = parseInt( state.match( /^\s*\*\s*(\d*)\s*EXISTS/m )[1] );
			//var recent = parseInt( state.match( /^\s*\*\s*(\d*)\s*RECENT/m )[1] );
			
			if ( exists > 0 ) {
				fetch();
			} else {
				REPORT_COUNT( 0 );
				logout();
			}
		}
	}

	function fetchHandler( RESULT ) {
		debug( "fetchHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a03 BAD" ) != -1 ) || ( state.indexOf( "a03 NO" ) != -1 ) ) {
			debug( "we are unable to fetch" );
			failure();
		}
		
		if ( state.indexOf( "a03 OK" ) != -1 ) {
			debug( "fetchHandler : successfull fetched" );
			state = state.replace(/\r/g, '' );
			var splittedState = state.split( '\n' );
			var newMails = 0;
			
			for ( var i = 0; i < splittedState.length; i++ ) {
				if ( ( splittedState[i].indexOf( "UID" ) != -1 ) && ( splittedState[i].indexOf( "\\Seen" ) == -1 ) && ( splittedState[i].indexOf( "\\Deleted" ) == -1 ) ) {
					newMails++;
				}
			}
			
			debug( "fetchHandler : reporting " + newMails + " new mails" );
			REPORT_COUNT( newMails );
			
			if ( newMails > 0 ) {
				/* the most recent message is the one with no \seen, no \deleted and highest UID */
				state = state.replace(/\r/g, '' );
				var temp = state.split( '\n' );
				var latestMailID = 0;
				var latestMail = 0;
				
				for ( var i = 0; i < temp.length; i++ ) {
					if ( ( temp[i].indexOf( "\\Seen" ) == -1 ) && ( temp[i].indexOf( "\\Deleted" ) == -1 ) ) {
						if ( parseInt( temp[i].split( "UID " )[1] ) > latestMailID ) {
							latestMailID = parseInt( temp[i].split( "UID " )[1] );
							latestMail = parseInt( temp[i].split( "* " )[1] );
							debug( latestMailID + " - " + latestMail );
						}
					}
				}
			
				debug( "fetchHandler : try to fetch " + latestMail );
				fetchHeader( latestMail );
			} else {
				//LAST_MAIL( null, null, null );
				logout();
			}
		}
	}
	
	function fetchHeaderHandler( RESULT ) {
		debug( "fetchHeaderHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a04 BAD" ) != -1 ) || ( state.indexOf( "a04 NO" ) != -1 ) ) {
			debug( "we are unable to fetch the Header" );
			failure();
		}
		
		if ( state.indexOf( "a04 OK" ) != -1 ) {
			debug( "fetchHeaderHandler : successfull fetched" );
			state = state.replace(/\r/g, '' );
			state = state.replace(/\n\s/g, ' ' );
			debug(state);
			//From: jim panse <jimpanse@example.com>
			//from: "Jim Panse" <jimpanse@example.com>
			//FROM: jimpanse@example.com (Jim Panse)
			//FROM: jimpanse@example.com
			var from = state.match( new RegExp( "(?:^From:\\s*(?:\\\"?\\s*(.*?)\\s*\\\"?)\\s*(?:<(.*)>)\\s*$)|(?:^From:\\s*(.*?)\\s*\\((.*)\\)\\s*$)|(?:^From:\\s*(.*?)\\s*$)", "mi" ) );
			var subject = state.match( /^Subject:\s*(.*)$/mi );
			var date = state.match( /^Date:\s*(.*)$/mi );
						
			if ( !date ) {
				date = state.match( /^Delivery-date:\s*(.*)$/mi );
			}
			
			debug( from );
			
			/*
			ranking
			1
			2 if 1.length == 0
			4
			3 if 4.length == 0
			5
			*/
			
			if ( from ) {
				debug( from );
				
				if ( from[1] != undefined ) {
					if ( from[1].length != 0 ) {
						from = from[1];
					} else {
						from = from[2];
					}
				} else {
					if ( from[4] != undefined ) {
						if ( from[4].length != 0 ) {
							from = from[4];
						} else {
							from = from[3];
						}
					} else {
						if ( from[5] != undefined ) {
							from = from[5];
						} else {
							from = "-";
						}
					}
				}
			} else {
				from = "-";
			}
			
			debug( from );
			
			if ( ( subject ) && ( subject.length > 1 ) && ( subject[0].indexOf( "\n" ) == -1 ) ) {
				subject = subject[1];
			} else {
				subject = "-";
			}
			
			if ( ( date ) && ( date.length > 1 ) && ( date[0].indexOf( "\n" ) == -1 ) ) {
				date = date[1];
			} else {
				date = "-";
			}
			
			debug( "eMail from : " + from + "\nSubject : " + subject + "\nReceived on : " + date );
			LAST_MAIL( from, subject, date );
			logout();
		}
	}

	function logoutHandler( RESULT ) {
		debug( "logoutHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( ( state.indexOf( "a05 BAD" ) != -1 ) || ( state.indexOf( "a05 NO" ) != -1 ) ) {
			debug( "unable to logout" );
			forceDisconnect();
		}
		
		if ( state.indexOf( "* BYE" ) != -1 ) {
			debug( "logoutHandler : we are out" );
            timeoutCounter = setTimeout( postLogout, 5000 );
		}
	}
    
    function postLogoutHandler( RESULT ) {
		debug( "postLogoutHandler( " + RESULT + " )" );
		state += RESULT;
        
        timeoutCounter = setTimeout( forceDisconnect, 5000 );
	}
}
