//class for storing accounts that MailWidget can handle

function kwasiAccount() {
	this.valid = true;
	this.AccountName = "";
	this.AccountPath = "";
	this.AccountType = "";
	this.AuthenticationScheme = "";
	this.Hostname = "";
	this.InternalServerPath = "";
	this.PortNumber = 0;
	this.SSLEnabled = false;
	this.Username = "";
	this.uniqueId = "";
	this.Password = "";
	//this.indicator = 0;
	this.newLine = "\r\n";
	this.handler = null;
	//this.fail = false;

	this.debug = function() {
		debug( "valid : " + this.valid );
		debug( "AccountName : " + this.AccountName );
		debug( "AccountPath : " + this.AccountPath );
		debug( "AccountType : " + this.AccountType );
		debug( "AuthenticationScheme : " + this.AuthenticationScheme );
		debug( "Hostname : " + this.Hostname );
		debug( "InternalServerPath : " + this.InternalServerPath );
		debug( "PortNumber : " + this.PortNumber );
		debug( "SSLEnabled : " + this.SSLEnabled );
		debug( "Username : " + this.Username );
		debug( "uniqueId : " + this.uniqueId );
		debug( "Password : " + this.Password );
	};
	
	//this.doneHandler = function() {
	//	debug( "doneHandler()" );
	//};
	
	//this.failHandler = function() {
	//	debug( "failHandler()" );
	//	
	//	fail = true;
	//};
	
	function debug( STRING ) {
		_debug( "kwasiAccount : " + STRING );
	}
}



//class for acquireing MailAccounts
//mailAccounts is a variable that must be passed to the constructor. the accounts are stored in there.

function kwasiMailAccounts( MAIL_ACCOUNTS ) {
	function debug( string ) {
		_debug( "kwasiMailAccounts : " + string );
	}

	this.acquireMailAccounts = function( mailAccountsLoaded ) {
		var rawAccountArray = MailWidgetPlugin.getAppleMailAccounts();
		
		for ( var acc = 0; acc < rawAccountArray.length; acc += 10 ) {
			var currentAccount = new kwasiAccount();
			currentAccount.AccountName = rawAccountArray[acc];
			currentAccount.AccountPath = rawAccountArray[acc+1];
			currentAccount.AccountType = rawAccountArray[acc+2];
			currentAccount.AuthenticationScheme = rawAccountArray[acc+3];
			currentAccount.Hostname = rawAccountArray[acc+4];
			currentAccount.InternalServerPath = rawAccountArray[acc+5];
			currentAccount.PortNumber = rawAccountArray[acc+6];
			currentAccount.SSLEnabled = rawAccountArray[acc+7];
			currentAccount.Username = rawAccountArray[acc+8];
			currentAccount.uniqueId = rawAccountArray[acc+9];
			MAIL_ACCOUNTS.push( currentAccount );
		}
		
		debug( MAIL_ACCOUNTS );
		mailAccountsLoaded();
	};
}
