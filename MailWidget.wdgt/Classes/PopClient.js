//ACTIVE_ACCOUNT must be an object of type Account
//REPORT_COUNT must be of type theCounter( mailCount )
//LAST_MAIL must be of type theLastMail( sender, subject, date )
//FAIL( ACTIVE_ACCOUNT ) is called on errors
//DONE( ACTIVE_ACCOUNT ) is called on finished communication
//public commands are void checkMail() and void kill()
//please call kill() on removing

function kwasiPopClient( ACTIVE_ACCOUNT, REPORT_COUNT, LAST_MAIL, FAIL, DONE ) {
	var serverConnection;
	var state = "";
	var stateCount = 0;
	var ready = true;
	var uid = "";
	var useAPOP = true;
	var timeoutCounter;
	
	var leopard = widget.system( "test -f ~/Library/Mail/V2/MailData/MessageUidsAlreadyDownloaded3", null ).status;
	debug( "leopard = " + leopard );
	
	function debug( STRING ) {
		_debug( "kwasiPopClient : " + STRING );
	}
	
	this.checkMail = function() {
		debug( "checkMail()" );
		
		this.kill();
		//timeoutCounter = setTimeout( retry, 30000 );
		ready = false;
		getUid();
	};
	
	this.kill = function() {
		debug( "kill()" );
		
		if ( !ready ) {
			debug( "kill : killing connections" );
			cancel();
		}
	};
	
	function retry() {
		debug( "retry()" );
		
		if ( ACTIVE_ACCOUNT.newLine == "\r\n" ) {
			debug( "communication error. retrying with different line ending" );
			cancel();
			ACTIVE_ACCOUNT.newLine = "\n";
			setTimeout( getUid, 5000 );
		} else {
			ACTIVE_ACCOUNT.newLine = "\r\n";
			
			if ( useAPOP ) {
				retryWithoutAPOP();
			} else {
				cancel();
				FAIL( ACTIVE_ACCOUNT );
				DONE( ACTIVE_ACCOUNT );
			}
		}
	}
	
	function retryWithoutAPOP() {
		debug( "retryWithoutAPOP()" );
		
		cancel();
		useAPOP = false;
		setTimeout( getUid, 5000 );
	}
	
	function failure() {
		quit();
		ACTIVE_ACCOUNT.newLine = "\n";
		useAPOP = true;
		FAIL( ACTIVE_ACCOUNT );
	}
	
	function forceDisconnect() {
		ACTIVE_ACCOUNT.newLine = "\n";
		useAPOP = true;
		cancel();
		DONE( ACTIVE_ACCOUNT );
		FAIL( ACTIVE_ACCOUNT );
	}
	
	function getUid () {
		uid = "";
		
		if ( leopard ) {
			//fix me: put me into the plug in
		debug( "/usr/bin/sqlite3 ~/Library/Mail/MessageUidsAlreadyDownloaded3 'select ZMESSAGEID from ZSEENMESSAGE where ZACCOUNT=(select Z_PK from ZACCOUNT where ZACCOUNTID = \"" + ACTIVE_ACCOUNT.uniqueId + "\");';echo __EOF__" );
		serverConnection = widget.system( "/usr/bin/sqlite3 ~/Library/Mail/MessageUidsAlreadyDownloaded3 'select ZMESSAGEID from ZSEENMESSAGE where ZACCOUNT=(select Z_PK from ZACCOUNT where ZACCOUNTID = \"" + ACTIVE_ACCOUNT.uniqueId + "\");';echo __EOF__", uidEndHandler );
		} else {
			//fix me: put me into the plug in
		debug( "/usr/bin/sqlite3 ~/Library/Mail/V2/MailData/MessageUidsAlreadyDownloaded3 'select ZMESSAGEID from ZSEENMESSAGE where ZACCOUNT=(select Z_PK from ZACCOUNT where ZACCOUNTID = \"" + ACTIVE_ACCOUNT.uniqueId + "\");';echo __EOF__" );
		serverConnection = widget.system( "/usr/bin/sqlite3 ~/Library/Mail/V2/MailData/MessageUidsAlreadyDownloaded3 'select ZMESSAGEID from ZSEENMESSAGE where ZACCOUNT=(select Z_PK from ZACCOUNT where ZACCOUNTID = \"" + ACTIVE_ACCOUNT.uniqueId + "\");';echo __EOF__", uidEndHandler );
		}

		serverConnection.onreadoutput = stdout;
		serverConnection.onreaderror = stderr;
	}

	function stderr( RESULT ) {
		debug( "stderr : " + RESULT );
	}

	function stdout( RESULT ) {
		//debug( "stdout : " + RESULT );
		uid += RESULT;
	}
	
	function uidEndHandler( RESULT ) {
		debug( "uidEndHandler : " + RESULT );
		
		serverConnection = null;
		
		if ( uid.indexOf( "__EOF__" ) == -1 ) {
			debug( "ERROR in retrieving uids... retrying" );
			getUid();
		} else {
			debug( "SUCCESS..." );
			debug( "UID: " + uid );
			connect();
		}
	}
	
	function connect() {
		debug( "connect()" );
	
		stateCount = 0;
		
		if ( ACTIVE_ACCOUNT.SSLEnabled ) {
			debug( "/usr/bin/openssl s_client -connect " + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber );
			serverConnection = widget.system( "/usr/bin/openssl s_client -connect " + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber, popEndHandler );
		} else {
			debug( "/usr/bin/nc " + ACTIVE_ACCOUNT.Hostname + " " + ACTIVE_ACCOUNT.PortNumber );
			serverConnection = widget.system( "/usr/bin/nc " + ACTIVE_ACCOUNT.Hostname + " " + ACTIVE_ACCOUNT.PortNumber, popEndHandler );
		}
		
		serverConnection.onreaderror = errorHandler;
		serverConnection.onreadoutput = popHandler;
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function user() {
		debug( "user()" );
		
		stateCount = 1;
		debug( "sending : USER " + ACTIVE_ACCOUNT.Username );
		serverConnection.write( "USER " + ACTIVE_ACCOUNT.Username + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function pass() {
		debug( "pass()" );
		
		stateCount = 2;
		//debug( "sending : PASS " + ACTIVE_ACCOUNT.Password );
		debug( "sending : PASS PASSWORD" );
		serverConnection.write( "PASS " + ACTIVE_ACCOUNT.Password + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retry, 5000 );
	}
	
	function apop() {
		debug( "apop()" );
		
		stateCount = 3;
		var md5Hash = hex_md5( state + ACTIVE_ACCOUNT.Password );
		debug( "sending : APOP " + ACTIVE_ACCOUNT.Username + " " + md5Hash );
		serverConnection.write( "APOP " + ACTIVE_ACCOUNT.Username + " " + md5Hash + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( retryWithoutAPOP, 5000 );
	}
	
	function stat() {
		debug( "stat()" );
		
		stateCount = 4;
		debug( "sending : STAT" );
		serverConnection.write( "STAT" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}

	function uidl() {
		debug( "uidl()" );
		
		stateCount = 5;
		state = "";
		debug( "sending : UIDL" );
		serverConnection.write( "UIDL" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function top( MESSAGE ) {
		debug( "top( " + MESSAGE + " )" );
		
		stateCount = 6;
		state = "";
		debug( "sending : TOP " + MESSAGE + " 0" );
		serverConnection.write( "TOP " + MESSAGE + " 0" + ACTIVE_ACCOUNT.newLine );
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function quit() {
		debug( "quit()" );
		
		stateCount = 7;
		debug( "sending : QUIT" );
		debug( serverConnection );
		serverConnection.write( "QUIT" + ACTIVE_ACCOUNT.newLine);
		timeoutCounter = setTimeout( failure, 10000 );
	}
	
	function postQuit() {
		debug( "postQuit()" );
		
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

	function popEndHandler( RESULT ) {
		debug( "popEndHandler( " + RESULT + " )" );
		
		serverConnection = null;
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
	
	function popHandler( RESULT ) {
		debug( "popHandler( RESULT )" );
		debug( "popHandler : " + stateCount );
		
		clearTimeout( timeoutCounter );
		
		switch ( stateCount ) {
			case 0:	connectHandler( RESULT );
					break;
			case 1:	userHandler( RESULT );
					break;
			case 2:	passHandler( RESULT );
					break;
			case 3:	apopHandler( RESULT );
					break;
			case 4:	statHandler( RESULT );
					break;
			case 5:	uidlHandler( RESULT );
					break;
			case 6:	topHandler( RESULT );
					break;
			case 7:	quitHandler( RESULT );
					break;
			case 8:	postQuitHandler( RESULT );
					break;
			default:
		}
	}

	function connectHandler( RESULT ) {
		debug( "connectHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "we are unable to connect" );
			timeoutCounter = setTimeout( failure, 1000 );
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			debug( "connectHandler : we are connected" );
			
			if ( useAPOP ) {
				var timestamp = "";
				var begin = RESULT.indexOf( "<" );
				var end = RESULT.indexOf( ">" );
				
				if ( ( begin != -1 ) && ( end != -1 ) ) {
					timestamp = RESULT.substring( begin, end+1 );
				}
				
				if ( ( timestamp.indexOf( "." ) != -1 ) && ( timestamp.indexOf( "@" ) != -1 ) && ( timestamp.indexOf( ACTIVE_ACCOUNT.Hostname ) != -1 )  ) {
					debug( "connectHandler : Found Timestamp : " + timestamp + "\nUsing APOP" );
					/* required if we have to try again with \r\n - IH8 Microsoft */
					state = timestamp;
					apop();
				} else {
					debug( "connectHandler : no Timestamp found\nUsing USER PASS" );
					user();
				}
			} else {
				debug( "seems like apop failed once" );
				user();
			}
		} else {
			debug( "connectHandler is insane" );
		}
	}

	function userHandler( RESULT ) {
		debug( "userHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "wrong USER" );
			retry();
			//failure();
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			debug( "userHandler : USER accepted" );
			pass();
		} else {
			debug( "userHandler is insane" );
			retry();
		}
	}

	function passHandler( RESULT ) {
		debug( "passHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "wrong PASS" );
			timeoutCounter = setTimeout( failure, 1000 );
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			debug( "passHandler : USER PASS successfully authorized" );
			stat();
		} else {
			debug( "passHandler is insane" );
		}
	}

	function apopHandler( RESULT ) {
		debug( "apopHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "APOP does not authorize trying USER PASS next time" );
			retry();
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			debug( "apopHandler : APOP successfully authorized" );
			stat();
		} else {
			debug( "apopHandler is insane" );
			retry();
		}
	}

	function statHandler( RESULT ) {
		debug( "statHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "no STAT" );
			timeoutCounter = setTimeout( failure, 1000 );
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			var mailsOnServer = parseInt( RESULT.split( " " )[1] );
			
			if ( mailsOnServer > 0 ) {
				debug( "statHandler : Great we found " + mailsOnServer + " mails stored on the server" );
				uidl();
			} else {
				debug( "statHandler : no mails on server please QUIT" );
				debug( "statHandler : reporting zero new mails" );
				REPORT_COUNT( 0 );
				//debug( "statHandler : resetting from and subject" );
				//LAST_MAIL( null, null, null );
				quit();
			}
		} else {
			debug( "statHandler is insane" );
		}
	}

	function uidlHandler( RESULT ) {
		debug( "uidlHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "no UIDL" );
			timeoutCounter = setTimeout( failure, 1000 );
		} else {
			state += RESULT;
		}
		
		if ( state.indexOf( "\n." ) != -1 ) {
			state = state.replace(/\r/g, '' );
			var temp = state.split( '\n' );
			var newMailCount = 0;
			var newUIDL = new Array();
			
			for ( var i = 1; i < temp.length - 2; i++ ) {
				var currentUIDL = temp[i].substring( temp[i].indexOf( " " ) + 1 ); //starting from the first character after the first space to the end
				
				if ( uid.indexOf( currentUIDL ) == -1 ) {
					debug( "uidlHandler : found new eMail @ " + temp[i] );
					newMailCount++;
					newUIDL.push( temp[i].split( " " )[0] );
				}
			}
			
			debug( "uidlHandler : total newMailCount = " + newMailCount + "\n" + newUIDL );
			debug( "uidlHandler : reporting " + newMailCount + " new mails" );
			REPORT_COUNT( newMailCount );
			
			if ( newMailCount > 0) {
				if ( ( newUIDL[0] == 1 ) && ( newUIDL[newUIDL.length - 1] != temp[temp.length - 3].split( " " )[0] ) ) {
					debug( "uidlHandler : please try TOP 1" );
					top( 1 );
				} else {
					debug( "uidlHandler : please try TOP " + newUIDL[newUIDL.length - 1]);
					top( newUIDL[newUIDL.length - 1] );
				}
			} else {
				debug( "uidlHandler : no new eMails" );
				//debug( "uidlHandler : resetting from and subject" );
				//LAST_MAIL( null, null, null );
				quit();
			}
		}
	}
	
	function topHandler( RESULT ) {
		debug( "topHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "can't get header of last mail" );
			timeoutCounter = setTimeout( failure, 1000 );
		} else {
			state += RESULT;
		}
		
		if ( state.indexOf( "\n." ) != -1 ) {
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
			
			debug( "eMail from : " + from + "\nSubject : " + subject );
			LAST_MAIL( from, subject, date );
			quit();
		}
	}

	function quitHandler( RESULT ) {
		debug( "quitHandler( " + RESULT + " )" );
		
		if ( RESULT.indexOf( "-ERR" ) != -1 ) {
			debug( "can't QUIT" );
			forceDisconnect();
		} else if ( RESULT.indexOf( "+OK" ) != -1 ) {
			debug( "quitHandler : we are out" );
			timeoutCounter = setTimeout( postQuit, 5000 );
		} else {
			debug( "quitHandler is insane" );
			forceDisconnect();
		}
	}
	
	function postQuitHandler( RESULT ) {
		debug( "postLogoutHandler( " + RESULT + " )" );
		state += RESULT;
        
        timeoutCounter = setTimeout( forceDisconnect, 5000 );
	}
}
