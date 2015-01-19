//ACTIVE_ACCOUNT must be an object of type Account
//REPORT_COUNT must be of type theCounter( mailCount )
//LAST_MAIL must be of type theLastMail( sender, subject, date )
//FAIL( ACTIVE_ACCOUNT ) is called on errors
//DONE( ACTIVE_ACCOUNT ) is called on finished communication
//public commands are void checkMail() and void kill()
//please call kill() on removing

function kwasiExchangeClient( ACTIVE_ACCOUNT, REPORT_COUNT, LAST_MAIL, FAIL, DONE ) {
	var serverConnection;
	var state = "";
	var ready = true;
//	var timeoutCounter;
	
	function debug( STRING ) {
		_debug( "kwasiExchangeClient : " + STRING );
	}
	
	this.checkMail = function() {
		debug( "checkMail()" );
		
		this.kill();
		ready = false;
		var url = "http" + ( ACTIVE_ACCOUNT.SSLEnabled ? "s" : "" ) + "://" + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber + "/" + ACTIVE_ACCOUNT.InternalServerPath;
		debug(url);
		checkUnread();
	};
	
	this.kill = function() {
		debug( "kill()" );
		
		if ( !ready ) {
			serverConnection.cancel();
			ready = true;
		}
	};
	
	
	function sendRequest( DATA, REQUEST_HANDLER ) {
		state = "";
		var url = "http" + ( ACTIVE_ACCOUNT.SSLEnabled ? "s" : "" ) + "://" + ACTIVE_ACCOUNT.Hostname + ":" + ACTIVE_ACCOUNT.PortNumber + "/" + ACTIVE_ACCOUNT.InternalServerPath;
		debug( "if [ -e /opt/local/bin/curl ]; then	/opt/local/bin/curl --user " + ACTIVE_ACCOUNT.Username + ":" + ACTIVE_ACCOUNT.Password + " --location --silent --show-error --ntlm --header \"content-type: text/xml; charset=utf-8\" --header \"SoapAction:\"\"\" --data \"" + DATA + "\" \"" + url + "\";echo \"<EOF>\"; else /usr/bin/curl --user " + ACTIVE_ACCOUNT.Username + ":" + ACTIVE_ACCOUNT.Password + " --location --silent --show-error --ntlm --header \"content-type: text/xml; charset=utf-8\" --header \"SoapAction:\"\"\" --data \"" + DATA + "\" \"" + url + "\";echo \"<EOF>\"; fi;" );
		serverConnection = widget.system( "if [ -e /opt/local/bin/curl ]; then	/opt/local/bin/curl --user " + ACTIVE_ACCOUNT.Username + ":" + ACTIVE_ACCOUNT.Password + " --location --silent --show-error --ntlm --header \"content-type: text/xml; charset=utf-8\" --header \"SoapAction:\"\"\" --data \"" + DATA + "\" \"" + url + "\";echo \"<EOF>\"; else /usr/bin/curl --user " + ACTIVE_ACCOUNT.Username + ":" + ACTIVE_ACCOUNT.Password + " --location --silent --show-error --ntlm --header \"content-type: text/xml; charset=utf-8\" --header \"SoapAction:\"\"\" --data \"" + DATA + "\" \"" + url + "\";echo \"<EOF>\"; fi;", exchangeEndHandler );
		serverConnection.onreaderror = errorHandler;
		serverConnection.onreadoutput = REQUEST_HANDLER;
	}
	
	function checkUnread() {
		var request  = "<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?>";
			request += "<soap:Envelope xmlns:soap=\\\"http://schemas.xmlsoap.org/soap/envelope/\\\" xmlns:t=\\\"http://schemas.microsoft.com/exchange/services/2006/types\\\">";
			request += "	<soap:Body>";
			request += "		<GetFolder xmlns=\\\"http://schemas.microsoft.com/exchange/services/2006/messages\\\" xmlns:t=\\\"http://schemas.microsoft.com/exchange/services/2006/types\\\">";
			request += "			<FolderShape>";
			request += "				<t:BaseShape>Default</t:BaseShape>";
			request += "			</FolderShape>";
			request += "			<FolderIds>";
			request += "				<t:DistinguishedFolderId Id=\\\"inbox\\\"/>";
			request += "			</FolderIds>";
			request += "		</GetFolder>";
			request += "	</soap:Body>";
			request += "</soap:Envelope>";
		
		sendRequest( request, checkUnreadHandler );
	}
	
	function getUnreadHeader() {
		var request  = "<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\"?>";
			request += "<soap:Envelope xmlns:soap=\\\"http://schemas.xmlsoap.org/soap/envelope/\\\" xmlns:t=\\\"http://schemas.microsoft.com/exchange/services/2006/types\\\">";
			request += "	<soap:Body>";
			request += "		<FindItem xmlns=\\\"http://schemas.microsoft.com/exchange/services/2006/messages\\\" xmlns:t=\\\"http://schemas.microsoft.com/exchange/services/2006/types\\\" Traversal=\\\"Shallow\\\">";
			request += "			<ItemShape>";
			request += "				<t:BaseShape>IdOnly</t:BaseShape>";
			request += "				<t:AdditionalProperties>";
			request += "					<t:FieldURI FieldURI=\\\"message:From\\\"/>";
			request += "					<t:FieldURI FieldURI=\\\"item:Subject\\\"/>";
			request += "					<t:FieldURI FieldURI=\\\"item:DateTimeSent\\\"/>";
			request += "					<t:FieldURI FieldURI=\\\"message:IsRead\\\"/>";
			request += "				</t:AdditionalProperties>";
			request += "			</ItemShape>";
			request += "			<FractionalPageItemView MaxEntriesReturned=\\\"1\\\" Numerator=\\\"0\\\" Denominator=\\\"1\\\"/>";
			request += "			<Restriction>";
			request += "				<t:IsEqualTo>";
			request += "					<t:FieldURI FieldURI=\\\"message:IsRead\\\"/>";
			request += "					<t:FieldURIOrConstant>";
			request += "						<t:Constant Value=\\\"false\\\"/>";
			request += "					</t:FieldURIOrConstant>";
			request += "				</t:IsEqualTo>";
			request += "			</Restriction>";
			request += "			<SortOrder>";
			request += "				<t:FieldOrder Order=\\\"Descending\\\">";
			request += "					<t:FieldURI FieldURI=\\\"item:DateTimeSent\\\"/>";
			request += "				</t:FieldOrder>";
			request += "			</SortOrder>";
			request += "			<ParentFolderIds>";
			request += "				<t:DistinguishedFolderId Id=\\\"inbox\\\"/>";
			request += "			</ParentFolderIds>";
			request += "		</FindItem>";
			request += "	</soap:Body>";
			request += "</soap:Envelope>";
		
		sendRequest( request, getUnreadHeaderHandler );
	}
	
	function exchangeEndHandler( RESULT ) {
		debug( "exchangeEndHandler (" + RESULT + ")" );
	}
	
	function errorHandler( RESULT ) {
		debug( "errorHandler( " + RESULT + " )" );
	}
	
	function checkUnreadHandler( RESULT ) {
		debug( "checkUnreadHandler( " + RESULT + " )" );
		state += RESULT;
		
		if ( state.indexOf( "<EOF>" ) != -1 ) {
			if ( state.length < 10 ) {
				debug( state );
				DONE( ACTIVE_ACCOUNT );
				FAIL( ACTIVE_ACCOUNT );
				ready = true;
			} else {
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString( state, "text/xml" );
				var responseError = xmlDoc.getElementsByTagName( "ResponseCode" )[0].firstChild.nodeValue;
				
				if ( responseError != "NoError" ) {
					debug( state );
					debug( responseError );
					DONE( ACTIVE_ACCOUNT );
					FAIL( ACTIVE_ACCOUNT );
					ready = true;
				} else {
					var unreadCount = parseInt( xmlDoc.getElementsByTagName( "UnreadCount" )[0].firstChild.nodeValue );
					
					if ( unreadCount > 0 ) {
						REPORT_COUNT( unreadCount );
						getUnreadHeader();
					} else {
						REPORT_COUNT( 0 );
						DONE( ACTIVE_ACCOUNT );
						ready = true;
					}
				}
			}
		}
	}
	
	function getUnreadHeaderHandler( RESULT ) {
		debug( "getUnreadHeaderHandler( " + RESULT + " )" );
		
		state += RESULT;
		
		if ( state.indexOf( "<EOF>" ) != -1 ) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString( state, "text/xml" );
			var responseError = xmlDoc.getElementsByTagName( "ResponseCode" )[0].firstChild.nodeValue;
			
			if ( responseError != "NoError" ) {
				debug( responseError );
				DONE( ACTIVE_ACCOUNT );
				FAIL( ACTIVE_ACCOUNT );
				ready = true;
			} else {
				var from = xmlDoc.getElementsByTagName( "Name" )[0].firstChild.nodeValue;
				var subject;
				
				if ( xmlDoc.getElementsByTagName( "Subject" )[0].hasChildNodes() > 0 ) {
					subject = xmlDoc.getElementsByTagName( "Subject" )[0].firstChild.nodeValue;
				} else {
					subject = "-";
				}
				
				var date = xmlDoc.getElementsByTagName( "DateTimeSent" )[0].firstChild.nodeValue;
				debug( "eMail from : " + from + "\nSubject : " + subject + "\nReceived on : " + date );
				LAST_MAIL( from, subject, date );
				DONE( ACTIVE_ACCOUNT );
				ready = true;
			}
		}
	}
}
