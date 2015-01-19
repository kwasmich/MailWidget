var g_name = null;
var g_checkOnShow = false;
var g_checkInterval = 15;
var g_audioVolume = 1;
var g_customAudio = null;
var g_autoUpdate = true;
var g_growl = true;
var g_updateLink = "http://www.kwasi-ich.de/";
var g_performAutoUpdate = null;
var g_pasteTarget = 1; //1 = front, 2 = audio, 0 = none
var g_focusAudio = false;

var g_mouseOver = false;
var g_shiftDown = false;

function UIinit() {
	debug( "UIinit()" );

	document.getElementById( "accountSelector" ).style.display = "none";	//quirk fix for unhideable lists
	document.getElementById( "accountSelectorScrollArea" ).object._scrollbars[0]._thumb.style.width = "19px";	//quirk fix for too wide scroll thumb div
	
	g_UIaudioRestore = self.location.href;
	g_UIaudioRestore = g_UIaudioRestore.match( /file:\/\/(.*)main\.html/ );
	g_UIaudioRestore = decodeURI( g_UIaudioRestore[1] );
	
	document.addEventListener( "mouseover", UImouseOver, true );
	document.addEventListener( "mouseout", UImouseOut, true );
}

function UImouseOver() {
	g_mouseOver = true;
	UIshowZoomButton();
}

function UImouseOut() {
	g_mouseOver = false;
	UIshowZoomButton();
}

var g_UIZoomButtonAnimator = null;

function UIcaptureKeyEvent( EVENT )
{
	if ( EVENT.keyIdentifier == "Shift" ) {
		if ( EVENT.type == "keydown" ) {
			g_shiftDown = true;
		} else {
			g_shiftDown = false;
		}
	}
	
	UIshowZoomButton();
	
	if ( g_focusAudio ) {
		if ( ( EVENT.which == 8 ) || ( EVENT.which == 46 ) ) {
			UIresetAudio();
			EVENT.preventDefault();
		}
	}
}

function UIshowZoomButton( EVENT )
{
	//debug( "UIshowZoomButton( " + EVENT + " )" );
	
	var itemToFade = document.getElementById( "zoomButton" );
	var itemToFadeMini = document.getElementById( "zoomButtonMini" );
	var startOpacity = parseFloat( itemToFade.style.opacity );

	if ( isNaN( startOpacity ) ) {
		startOpacity = 0;
	}

	var fadeInHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;
		itemToFadeMini.style.opacity = CURRENT;

		if ( START ) {
			itemToFade.style.visibility = "visible";
			itemToFadeMini.style.visibility = "visible";
		}
	};

	var fadeOutHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;
		itemToFadeMini.style.opacity = CURRENT;

		if ( FINISH ) {
			itemToFade.style.visibility = "hidden";
			itemToFadeMini.style.visibility = "hidden";
		}
	};
	
	if ( g_mouseOver && g_shiftDown ) {
		if ( g_UIZoomButtonAnimator ) {
			g_UIZoomButtonAnimator.stop();
			delete g_UIZoomButtonAnimator;
		}
		
		g_UIZoomButtonAnimator = new AppleAnimator( 0, 13, startOpacity, 1, fadeInHandler );
		g_UIZoomButtonAnimator.start();
	} else {
		if ( g_UIZoomButtonAnimator ) {
			g_UIZoomButtonAnimator.stop();
			delete g_UIZoomButtonAnimator;
		}
	
		g_UIZoomButtonAnimator = new AppleAnimator( 0, 13, startOpacity, 0, fadeOutHandler );
		g_UIZoomButtonAnimator.start();
	}
}

function UIpaste( EVENT )
{
	debug( "UIpaste( " + EVENT + " )" );
	
	try {
		var uriList = getFilesFromEvent( EVENT );
		
		if ( uriList.length > 0 ) {
			switch ( g_pasteTarget ) {
				case 2:
					if ( g_focusAudio || ( EVENT.type == "drop" ) ) {
						g_customAudio = uriList;
						document.getElementById("audioPlayerDropBox").style.background = "url( Images/dropWell.png ) no-repeat 0 -132px";
					}
					
					UIblurAudio();
					break;
				case 1:
					var POSIXfileList = new Array();
					var POSIXfileString;
					
					for ( var uri = 0; uri < uriList.length; uri++ ) {
						POSIXfileString = decodeURI( uriList[uri] ).split( "localhost" )[1];
						POSIXfileString = POSIXfileString.replace( /\\/g, "\\\\" );
						POSIXfileString = POSIXfileString.replace( /"/g, "\\\"" );
						POSIXfileList.push( POSIXfileString )
					}
					
					var executeString = "tell application \"Mail\" to open { POSIX file \"" + POSIXfileList[0] + "\""
					
					for ( var uri = 1; uri < POSIXfileList.length; uri++ ) {
						executeString += ", POSIX file \"" + POSIXfileList[uri] + "\"";
					}
					
					executeString += " }";
					executeString = executeString.replace( /\\/g, "\\\\" );
					executeString = executeString.replace( /"/g, "\\\"" );
					widget.system( "osascript -e \"" + executeString + "\"", function() {} );
					break;
				default:
					break;
			}
			
			EVENT.stopPropagation();
			EVENT.preventDefault();
		}
	} catch ( ex ) {
		debug( ex );
		
		UIblurAudio();
	}
}





/////////////////
//			   //
//  FrontSide  //
//			   //
/////////////////



/*********************/
/* ActivityIndicator */
/*********************/

var g_UIactivityIndicatorAnimator = null;

function UIactivityIndicator( BOOL )
{
	debug( "UIactivityIndicator( " + BOOL + " )" );
	
	var itemToAnimate = document.getElementById( "activityIndicator" );
	var itemToAnimateStep = 0;

	var animationHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToAnimate.style.background = "url( Images/Async.png ) no-repeat 0 " + ( -16 * itemToAnimateStep ) + "px"
		itemToAnimateStep++;

		if ( itemToAnimateStep == 12 ) {
			itemToAnimateStep = 0;
		}

		if ( START ) {
			itemToAnimate.style.visibility = "visible";
		}

		if ( FINISH ) {
			itemToAnimate.style.visibility = "hidden";
		}
	};

	if ( g_UIactivityIndicatorAnimator ) {
		g_UIactivityIndicatorAnimator.stop();
		delete g_UIactivityIndicatorAnimator;
	}

	if ( BOOL ) {
		g_UIactivityIndicatorAnimator = new AppleAnimator( 60000, 40, 0, 1, animationHandler );
	} else {
		g_UIactivityIndicatorAnimator = new AppleAnimator( 0, 40, 0, 1, animationHandler );
	}

	g_UIactivityIndicatorAnimator.start();
}



/****************/
/* NoConnection */
/****************/

var g_UInoConnectionAnimator = null;

function UInoConnection( BOOL ) {
	debug( "UInoConnection( " + BOOL + " )" );
	
	var itemToAnimate = document.getElementById( "noConnection" );
	var itemToAnimateMini = document.getElementById( "noConnectionMini" );
	var animState = false;
	
	var animationHandler = function() {
		if ( animState ) {
			itemToAnimate.style.background = "url( Images/nc.png ) no-repeat 0 0";
			itemToAnimateMini.style.background = "url( Images/nc.png ) no-repeat 0 0";
		} else {
			itemToAnimate.style.background = "url( Images/nc.png ) no-repeat 0 -32px";
			itemToAnimateMini.style.background = "url( Images/nc.png ) no-repeat 0 -32px";
		}
		
		animState = !animState;
	}
	
	if ( g_UInoConnectionAnimator ) {
		clearInterval( g_UInoConnectionAnimator );
		g_UInoConnectionAnimator = null;
		itemToAnimate.style.visibility = "hidden";
		itemToAnimateMini.style.visibility = "hidden";
	}
	
	if ( BOOL ) {
		itemToAnimate.style.background = "url( Images/nc.png ) no-repeat 0 0";
		itemToAnimate.style.visibility = "visible";
		itemToAnimateMini.style.background = "url( Images/nc.png ) no-repeat 0 0";
		itemToAnimateMini.style.visibility = "visible";
		g_UInoConnectionAnimator = setInterval( animationHandler, 1000 );
	}
}



/****************/
/* NewMailBadge */
/****************/

function UIbadgeCount( COUNT )
{
	debug( "UIbadgeCount( " + COUNT + " )" );
	
	var itemToFade = document.getElementById( "newMailBadge" );
	var itemToCountUp = document.getElementById( "newMailBadgeCount" );
	var endCount = COUNT;
	var startCount = parseInt( itemToCountUp.innerText );
	var startOpacity = parseFloat( itemToFade.style.opacity );
	
	document.getElementById( "newMailBadgeCountMini" ).innerText = endCount;
	
	if ( endCount ) {
		document.getElementById( "newMailBadgeMini" ).style.visibility = "visible";
	} else {
		document.getElementById( "newMailBadgeMini" ).style.visibility = "hidden";
	}
	
	if ( isNaN( startCount ) ) {
		startCount = 0;
	}
	
	if ( isNaN( startOpacity ) ) {
		startOpacity = 0;
	}

	if ( (endCount - startCount) == 0 ) {
		return;
	}

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		var count = Math.round( CURRENT * endCount + (1 - CURRENT) * startCount );
		itemToFade.style.opacity = CURRENT * 1 + (1-CURRENT) * startOpacity;
		itemToCountUp.innerText = count;

		if ( count > 9999 ) {
			document.getElementById( "newMailBadge" ).style.background = "url( Images/NewMail5.png ) no-repeat 50% 50%";
		} else if ( count > 999 ) {
			document.getElementById( "newMailBadge" ).style.background = "url( Images/NewMail4.png ) no-repeat 50% 50%";
		} else if ( count > 99 ) {
			document.getElementById( "newMailBadge" ).style.background = "url( Images/NewMail3.png ) no-repeat 50% 50%";
		} else {
			document.getElementById( "newMailBadge" ).style.background = "url( Images/NewMail2.png ) no-repeat 50% 50%";
		}

		if ( START ) {
			itemToFade.style.visibility = "visible";
		}
		
		if ( FINISH ) {
			if ( CURRENT == 0 ) {
				itemToFade.style.visibility = "hidden";	//quirk fix avoid hovering event on invisible items
			}
		}
		
	};

	if ( endCount > 0) {
		new AppleAnimator( 500, 13, 0, 1, fadeHandler ).start();
	} else {
		endCount = startCount;
		startCount = 0;
		startOpacity = 0;
		new AppleAnimator( 500, 13, 1, 0, fadeHandler ).start();
	}
}



/**************/
/* MailHeader */
/**************/

var g_UIMailHeaderAnimator = null;

function UIshowMailHeader( EVENT )
{
	debug( "UIshowMailHeader( " + EVENT + " )" );
	
	var itemToFade = document.getElementById( "mailHeader" );
	var startOpacity = parseFloat( itemToFade.style.opacity );

	if ( isNaN( startOpacity ) ) {
		startOpacity = 0;
	}

	var fadeInHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( START ) {
			itemToFade.style.visibility = "visible";
		}
	};

	var fadeOutHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( FINISH ) {
			itemToFade.style.visibility = "hidden";
		}
	};
	
	if ( g_UIMailHeaderAnimator ) {
		g_UIMailHeaderAnimator.stop();
		delete g_UIMailHeaderAnimator;
	}
	
	if ( EVENT.type == "mouseover" ) {
		g_UIMailHeaderAnimator = new AppleAnimator( 125, 13, startOpacity, 1, fadeInHandler );
	} else {
		g_UIMailHeaderAnimator = new AppleAnimator( 250, 13, startOpacity, 0, fadeOutHandler );
	}

	g_UIMailHeaderAnimator.start();
}

function UIsetMailHeader( FROM, SUBJECT )
{
	debug( "UIsetMailHeader( " + FROM + ", " + SUBJECT + " )" );

	document.getElementById( "mailHeaderFrom" ).innerText = FROM;
	document.getElementById( "mailHeaderSubject" ).innerText = SUBJECT;
}



/**************/
/* LaunchMail */
/**************/

function UIlaunchMail()
{
	debug( "UIlaunchMail()" );
	
	widget.openApplication( "com.apple.dock" );
	MailWidgetPlugin.appleMailLaunchAndCheck();
	
	/*
	for ( var acc = 0; acc < g_MailAccounts.length; acc++ ) {
		if ( g_MailAccounts[acc].handler ) {
			widget.system( "osascript -e 'tell application \"Mail\" to check for new mail for account \"" + g_MailAccounts[acc].AccountName + "\"'", function () {} );
		}
	}
	*/
	//UIbadgeCount( 0 );
}

/*
function UIlaunchMailDragDrop( EVENT )
{
	debug( "UIlaunchMailDragDrop( " + EVENT + " )" );

	var uriList = getFilesFromEvent( EVENT, true );
	var POSIXfileList = new Array();
	var POSIXfileString;
	
	for ( var uri = 0; uri < uriList.length; uri++ ) {
		POSIXfileString = decodeURI( uriList[uri] ).split( "localhost" )[1];
		POSIXfileString = POSIXfileString.replace( /\\/g, "\\\\" );
		POSIXfileString = POSIXfileString.replace( /"/g, "\\\"" );
		POSIXfileList.push( POSIXfileString )
	}
	
	var executeString = "tell application \"Mail\" to open { POSIX file \"" + POSIXfileList[0] + "\""
	
	for ( var uri = 1; uri < POSIXfileList.length; uri++ ) {
		executeString += ", POSIX file \"" + POSIXfileList[uri] + "\"";
	}
	
	executeString += " }";
	executeString = executeString.replace( /\\/g, "\\\\" );
	executeString = executeString.replace( /"/g, "\\\"" );
	widget.system( "osascript -e \"" + executeString + "\"", function() {} );
	
	EVENT.stopPropagation();
	EVENT.preventDefault();
}
*/

function UIlaunchMailDrag( EVENT )
{
	//debug( "UIlaunchMailDrag( " + EVENT + " )" );

	EVENT.stopPropagation();
	EVENT.preventDefault();
}



/**********************/
/* UpdateNotification */
/**********************/

function UIcheckForUpdate()
{
	g_autoUpdateManager.checkNow();
}

function UIaskForUpdate( VERSION, LINK, DOIT )
{
	debug( "UIaskForUpdate( " + VERSION + ", " + LINK + ", " + DOIT + " )" );
	
	showFront();
	var textAreaToChange = document.getElementById( "updateNotificationText" );
	var newTextAreaText = dashcode.getLocalizedString( dashcodePartSpecs.updateNotificationText.text );
	newTextAreaText = newTextAreaText.replace( /%f/, VERSION );
	textAreaToChange.innerText = newTextAreaText;
	g_updateLink = LINK;
	g_performAutoUpdate = DOIT;
	var itemToFade = document.getElementById( "updateNotification" );

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( START ) {
			itemToFade.style.visibility = "visible";
			UIentitle();
		}
	};

	new AppleAnimator( 250, 13, 0, 1, fadeHandler ).start();
}

function UIgoToUpdate()
{
	debug( "UIgoToUpdate()" );
	
	widget.openURL( g_updateLink );
}

function UIskipUpdate()
{
	debug( "UIskipUpdate()" );
	
	var itemToFade = document.getElementById( "updateNotification" );

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( FINISH ) {
			itemToFade.style.visibility = "hidden";
		}
	};

	new AppleAnimator( 500, 13, 1, 0, fadeHandler ).start();
	
	if ( g_performAutoUpdate ) {
		g_performAutoUpdate( false );
	}
}

function UIperformUpdate()
{
	debug( "UIperformUpdate()" );
	
	if ( g_performAutoUpdate ) {
		g_performAutoUpdate( UIrestartAfterUpdate );
	}
}

function UIrestartAfterUpdate()
{
	debug( "UIrestartAfterUpdate()" );
	
	var itemToFade = document.getElementById( "updateNotificationReboot" );

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( START ) {
			itemToFade.style.visibility = "visible";
		}
	};
	
	new AppleAnimator( 250, 13, 0, 1, fadeHandler ).start();
	UIentitle();
}



/*********************/
/* ActiveAccountName */
/*********************/

function UIeditName()
{
	debug( "UIeditName()" );
	
	var nameTextfield = document.getElementById( "nameTextfield" );
	nameTextfield.style.visibility = "visible";
	nameTextfield.focus();
}

function UIchangeName( EVENT )
{
	debug( "UIchangeName( " + EVENT + " )" );
	
	var nameTextfield = document.getElementById( "nameTextfield" );
	nameTextfield.style.visibility = "hidden";
	UIsetName( nameTextfield.value );
	
	widget.setPreferenceForKey( nameTextfield.value, widget.identifier + "-" + "name" );	//fix me: put me somewhere else
	
	EVENT.stopPropagation();
	EVENT.preventDefault();
}

function UIsetName( STRING )
{
	debug( "UIsetName( " + STRING + " )" );
		
	g_name = STRING;
	document.getElementById( "nameTextfield" ).value = STRING;
	UIdisplayName();
}

function UIdisplayName()
{
	if ( g_name ) {
		document.getElementById( "nameText" ).innerText = g_name;
	} else {
		for ( var acc = 0; acc < g_MailAccounts.length; acc++ ) {
			if ( g_MailAccounts[acc].handler ) {
				document.getElementById( "nameText" ).innerText = g_MailAccounts[acc].AccountName;
				return;
			}
		}
		
		document.getElementById( "nameText" ).innerText = "";
	}
	
	UIentitle();
}


////////////////
//			  //
//  MiniSide  //
//			  //
////////////////



/********************/
/* ZoomingAnimation */
/********************/
var g_UIzooming = false;

function UItoggleMini(event)
{
	debug( "UItoggleMini( " + event + ")" );

	var front = document.getElementById("front");
	var mini = document.getElementById("mini");
	var shrink = ( window.innerHeight == 160 );
	var itemToScale = document.getElementById( "frontImgMini" );
	var itemToTranslate = document.getElementById( "zoomButtonMini" );
	var newMailBadgeVisibility = document.getElementById( "newMailBadge" ).style.visibility;
	var noConnectionVisibility = document.getElementById( "noConnection" ).style.visibility;

	var scaleHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToScale.style.width = CURRENT * 80 + (1-CURRENT) * 160 + "px";
		itemToScale.style.height = CURRENT * 80 + (1-CURRENT) * 160 + "px";
		itemToTranslate.style.top = CURRENT * 4 + (1-CURRENT) * 21 + "px";
		itemToTranslate.style.left = CURRENT * 0 + (1-CURRENT) * 12 + "px";
		
		if ( START ) {
			if ( !shrink ) {
				window.resizeTo( 160, 160 );
				
				if (window.widget) {
					widget.setCloseBoxOffset( 24, 33 );
				}
			} else {
				mini.style.display="block";
				front.style.display="none";
			}
			
			document.getElementById( "newMailBadge" ).style.visibility = "hidden";
			document.getElementById( "newMailBadgeMini" ).style.visibility = "hidden";
			document.getElementById( "noConnection" ).style.visibility = "hidden";
			document.getElementById( "noConnectionMini" ).style.visibility = "hidden";
			g_UIzooming = true;
		}
		
		if ( FINISH ) {
			if ( shrink ) {
				window.resizeTo( 80, 80 );
			
				if (window.widget) {
					widget.setCloseBoxOffset( 12, 16 );
				}
			} else {
				mini.style.display="none";
				front.style.display="block";
			}
			
			document.getElementById( "newMailBadge" ).style.visibility = newMailBadgeVisibility;
			document.getElementById( "newMailBadgeMini" ).style.visibility = newMailBadgeVisibility;
			document.getElementById( "noConnection" ).style.visibility = noConnectionVisibility;
			document.getElementById( "noConnectionMini" ).style.visibility = noConnectionVisibility;
			g_UIzooming = false;
		}
	};
	
	if ( !g_UIzooming ) {
		if ( shrink ) {
			widget.setPreferenceForKey( true, widget.identifier + "-" + "mini" ); //fix me: put me somewhere else
			new AppleAnimator( 500, 13, 0, 1, scaleHandler ).start();
		} else {
			widget.setPreferenceForKey( null, widget.identifier + "-" + "mini" ); //fix me: put me somewhere else
			new AppleAnimator( 500, 13, 1, 0, scaleHandler ).start();
		}
	}
}


////////////////
//			  //
//  BackSide  //
//			  //
////////////////



/*******************/
/* AccountSelector */
/*******************/

var g_UIselectedAccountIndex = -1;
var g_UIaccountList = {
	_rowData: [],

	numberOfRows: function() {
		return this._rowData.length;
	},

	prepareRow: function( ROW_ELEMENT, ROW_INDEX, TEMPLATE_ELEMENTS ) {
		if ( TEMPLATE_ELEMENTS.accountSelectorListLabel ) {
			TEMPLATE_ELEMENTS.accountSelectorListLabel.innerText = this._rowData[ROW_INDEX];
		}

		if ( TEMPLATE_ELEMENTS.accountSelectorListIndicator ) {
			TEMPLATE_ELEMENTS.accountSelectorListIndicator.object.setValue(0);
		}

		ROW_ELEMENT.onclick = function() {
			debug( "ROW_ELEMENT.onclick: " + ROW_ELEMENT + " " + ROW_INDEX );
			verifyAccount( ROW_INDEX );
		};
	}
};

function UIshowAccountSelector()
{
	debug( "UIshowAccountSelector()" );

	var itemToFade = document.getElementById( "accountSelector" );
	var itemToRefresh = document.getElementById( "accountSelectorScrollArea" );
	
	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;
		
		if ( START ) {
			itemToFade.style.visibility = "visible";
			itemToFade.style.display = "block";	//quirk fix for unhidable lists
			itemToRefresh.object.refresh();	//quirk fix for not showing up scrollbar
			UIentitle();
		}
	};

	new AppleAnimator( 250, 13, 0, 1, fadeHandler ).start();
	UIblurAudio();
}

function UIhideAccountSelector()
{
	debug( "UIhideAccountSelector()" );
	
	var itemToFade = document.getElementById( "accountSelector" );

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( FINISH ) {
			itemToFade.style.visibility = "hidden";
			itemToFade.style.display = "none";	//quirk fix for unhidable lists
		}
	};

	new AppleAnimator( 500, 13, 1, 0, fadeHandler ).start();
}

function UIaddToAccountList( NAME )
{
	debug( "UIaddToAccountList( " + NAME + " )" );
	
	if ( NAME ) {
		g_UIaccountList._rowData.push( NAME );
	} else {
		document.getElementById("list").object.reloadData();
		//document.getElementById("accountSelectorScrollArea").object.refresh();
	}
}

function UIsetIndicator( INDEX, VALUE )
{
	debug( "UIsetIndicator( " + INDEX + ", " + VALUE + " )" );
	
	document.getElementById("list").object.rows[INDEX].object.templateElements.accountSelectorListIndicator.object.setValue( VALUE );
}

function UIgetIndicator( INDEX )
{
	debug( "UIgetIndicator( " + INDEX + " )" );
	
	return document.getElementById("list").object.rows[INDEX].object.templateElements.accountSelectorListIndicator.object.value;
}

function verifyAccount( INDEX )
{
	debug( "verifyAccount( " + INDEX + " )" );
	
	g_UIselectedAccountIndex = INDEX;
	UIshowVerifyAccount();
}

function UIshowVerifyAccount()
{
	debug( "UIshowVerifyAccount()" );

	var itemToFade = document.getElementById( "verifyAccount" );
	document.getElementById( "verifyAccountName" ).innerText = g_MailAccounts[g_UIselectedAccountIndex].AccountName;

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( START ) {
			itemToFade.style.visibility = "visible";
			document.getElementById( "verifyAccountStatusIndicator" ).object.setValue( UIgetIndicator( g_UIselectedAccountIndex ) );
			document.getElementById( "verifyAccountPassword" ).value = g_MailAccounts[g_UIselectedAccountIndex].Password;
			UIentitle();
		}

		if ( FINISH ) {
			document.getElementById( "verifyAccountPassword" ).focus();
		}
	};

	new AppleAnimator( 250, 13, 0, 1, fadeHandler ).start();
}

function UIhideVerifyAccount()
{
	debug( "UIhideVerifyAccount()" );

	var itemToFade = document.getElementById( "verifyAccount" );

	var fadeHandler = function( ANIMATION, CURRENT, START, FINISH ) {
		itemToFade.style.opacity = CURRENT;

		if ( FINISH ) {
			itemToFade.style.visibility = "hidden";
		}
	};

	new AppleAnimator( 500, 13, 1, 0, fadeHandler ).start();
}

function UIperformVerifyAccount( EVENT )
{
	debug( "UIperformVerifyAccount( " + EVENT + " )" );

	g_MailAccounts[g_UIselectedAccountIndex].valid = false;
	g_MailAccounts[g_UIselectedAccountIndex].Password = document.getElementById( "verifyAccountPassword" ).value;

	if ( g_MailAccounts[g_UIselectedAccountIndex].AccountType == "POPAccount" ) {	//handle POP3
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiPopClient( g_MailAccounts[g_UIselectedAccountIndex], UIverifyAccountGotMailCount, function() {}, UIverifyAccountFail, UIverifyAccountDone );
	} else if ( g_MailAccounts[g_UIselectedAccountIndex].AccountType == "EWSAccount" ) {	//handle Exchange 2007
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiExchangeClient( g_MailAccounts[g_UIselectedAccountIndex], UIverifyAccountGotMailCount, function() {}, UIverifyAccountFail, UIverifyAccountDone );
	} else {	//handle IMAP
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiImapClient( g_MailAccounts[g_UIselectedAccountIndex], UIverifyAccountGotMailCount, function() {}, UIverifyAccountFail, UIverifyAccountDone );
	}

	document.getElementById( "verifyAccountStatusIndicator" ).object.setValue( 2 );
	UIsetIndicator(g_UIselectedAccountIndex, 2);
	g_MailAccounts[g_UIselectedAccountIndex].handler.checkMail();
	
	EVENT.stopPropagation();
	EVENT.preventDefault();
}

function UIverifyAccountGotMailCount()
{
	debug( "UIverifyAccountGotMailCount()" );

	g_MailAccounts[g_UIselectedAccountIndex].valid = true;
}

function UIverifyAccountDone()
{
	debug( "UIverifyAccountDone()" );

	if (g_MailAccounts[g_UIselectedAccountIndex].valid) {
		UIverifyAccountSuccess();
	} else {
		UIverifyAccountFail();
	}
}

function UIverifyAccountSuccess()
{
	debug( "UIverifyAccountSuccess()" );
	
	document.getElementById( "verifyAccountStatusIndicator" ).object.setValue( 1 );
	UIsetIndicator( g_UIselectedAccountIndex, 1 );

	delete g_MailAccounts[g_UIselectedAccountIndex].handler;

	if ( g_MailAccounts[g_UIselectedAccountIndex].AccountType == "POPAccount" ) {	//handle POP3
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiPopClient( g_MailAccounts[g_UIselectedAccountIndex], collectCount, collectHeaders, collectFail, collectDone );
	} else if ( g_MailAccounts[g_UIselectedAccountIndex].AccountType == "EWSAccount" ) {	//handle Exchange 2007
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiExchangeClient( g_MailAccounts[g_UIselectedAccountIndex], collectCount, collectHeaders, collectFail, collectDone );
	} else {	//handle IMAP
		g_MailAccounts[g_UIselectedAccountIndex].handler = new kwasiImapClient( g_MailAccounts[g_UIselectedAccountIndex], collectCount, collectHeaders, collectFail, collectDone );
	}

	UIhideVerifyAccount();
}

function UIverifyAccountFail()
{
	debug( "UIverifyAccountFail()" );
	
	document.getElementById( "verifyAccountStatusIndicator" ).object.setValue( 3 );
	UIsetIndicator( g_UIselectedAccountIndex, 3 );
	delete g_MailAccounts[g_UIselectedAccountIndex].handler;
	g_MailAccounts[g_UIselectedAccountIndex].handler = null;
}

function UIcancelVerifyAccount()
{
	debug( "UIcancelVerifyAccount()" );

	if ( g_MailAccounts[g_UIselectedAccountIndex].handler ) {
		g_MailAccounts[g_UIselectedAccountIndex].handler.kill();
		UIverifyAccountFail();
	}
	
	UIremoveAccount();	//fix me: make the removing and cancelling more meaningful
	UIhideVerifyAccount();
}

function UIremoveAccount()
{
	debug( "UIremoveAccount()" );

	g_MailAccounts[g_UIselectedAccountIndex].handler = null;
	UIsetIndicator( g_UIselectedAccountIndex, 0 );
	document.getElementById( "verifyAccountStatusIndicator" ).object.setValue( 0 );
	UIhideVerifyAccount();
}



/***************/
/* settingTabs */
/***************/

function UIshowCheckIntervalSettings()
{
	debug( "UIshowCheckIntervalSettings()" );

	var stackLayout = document.getElementById("settingsStackLayout").object;
	stackLayout.setCurrentView("checkIntervalSettings");
	
	g_pasteTarget = 0;
	document.getElementById("settingsTab1").style.visibility = "visible";
	document.getElementById("settingsTab2").style.visibility = "hidden";
	document.getElementById("settingsTab3").style.visibility = "hidden";
	document.getElementById("settingsTab4").style.visibility = "hidden";
	UIentitle();
	UIblurAudio();
}

function UIshowAudioPlayerSettings()
{
	debug( "UIshowAudioPlayerSettings()" );
	
	var stackLayout = document.getElementById("settingsStackLayout").object;
	stackLayout.setCurrentView("audioPlayerSettings");
	
	g_pasteTarget = 2;
	document.getElementById("settingsTab1").style.visibility = "hidden";
	document.getElementById("settingsTab2").style.visibility = "visible";
	document.getElementById("settingsTab3").style.visibility = "hidden";
	document.getElementById("settingsTab4").style.visibility = "hidden";
	UIentitle();
	UIblurAudio();
}

function UIshowUpdateSettings()
{
	debug( "UIshowUpdateSettings()" );

	var stackLayout = document.getElementById("settingsStackLayout").object;
	stackLayout.setCurrentView("updateSettings");
	
	g_pasteTarget = 0;
	document.getElementById("settingsTab1").style.visibility = "hidden";
	document.getElementById("settingsTab2").style.visibility = "hidden";
	document.getElementById("settingsTab3").style.visibility = "visible";
   	document.getElementById("settingsTab4").style.visibility = "hidden";
	UIentitle();
	UIblurAudio();
}

function UIshowGrowlSettings(event)
{
	debug( "UIshowGrowlSettings()" );

	var stackLayout = document.getElementById("settingsStackLayout").object;
	stackLayout.setCurrentView("growlSettings");
	
	g_pasteTarget = 0;
	document.getElementById("settingsTab1").style.visibility = "hidden";
	document.getElementById("settingsTab2").style.visibility = "hidden";
	document.getElementById("settingsTab3").style.visibility = "hidden";
   	document.getElementById("settingsTab4").style.visibility = "visible";
	UIentitle();
	UIblurAudio();
}


/*****************/
/* CheckInterval */
/*****************/

function UIsetCheckOnShow( STATE )
{
	debug( "UIsetCheckOnShow("+ STATE +")")
	var checkOnShowButton = document.getElementById("checkOnShowButton");
	checkOnShowButton.checked = STATE;
	UIchangeCheckOnShow();
}

function UIchangeCheckOnShow()
{
	var checkOnShowButton = document.getElementById("checkOnShowButton");
	g_checkOnShow = checkOnShowButton.checked;
}

function UIsetCheckInterval( VALUE )
{
	debug( "UIsetCheckInterval("+ VALUE +")" );
	
	var checkIntervalSlider = document.getElementById("checkIntervalSlider");
	checkIntervalSlider.value = VALUE;
	UIchangeCheckInterval();
}

function UIchangeCheckInterval()
{
	debug( "UIchangeCheckInterval()" );
	
	var checkIntervalSlider = document.getElementById("checkIntervalSlider");
	g_checkInterval = parseInt( checkIntervalSlider.value );

	var textAreaToChange = document.getElementById("checkIntervalCaption");
	var newTextAreaText = dashcode.getLocalizedString( dashcodePartSpecs.checkIntervalCaption.text );
	newTextAreaText = newTextAreaText.replace( /%i/, g_checkInterval );
	textAreaToChange.innerText = newTextAreaText;

	var checkOnShowButton = document.getElementById("checkOnShowButton");
	var doCheckIntervalIndicator = document.getElementById("doCheckInterval");

	if ( g_checkInterval ) {
		checkOnShowButton.checked = g_checkOnShow;
		checkOnShowButton.disabled = false;
		doCheckIntervalIndicator.style.background = "url( Images/Timer.png ) no-repeat 0 0"
	} else {
		newTextAreaText = dashcode.getLocalizedString( "«Check on showing Dashboard»" );
		textAreaToChange.innerText = newTextAreaText;
		checkOnShowButton.checked = true;
		checkOnShowButton.disabled = true;
		doCheckIntervalIndicator.style.background = "url( Images/Timer.png ) no-repeat 0 -20px";
	}
	
	resetInterval();
	UIentitle();
}



/*********************/
/* AudioAnnouncement */
/*********************/

var g_UIpreviousAudio = -1;
var g_UIaudioRestore;

function UIsetVolume( VALUE )
{
	debug( "UIsetVolume("+ VALUE +")")
	var audioVolumeSlider = document.getElementById("audioPlayerVolume");
	audioVolumeSlider.value = VALUE * 100;
	UIchangeVolume();
}


function UIchangeVolume()
{
	var audioVolumeSlider = document.getElementById("audioPlayerVolume");
	g_audioVolume = parseInt( audioVolumeSlider.value ) * 0.01;

	var textAreaToChange = document.getElementById("audioPlayerVolumeCaption");
	var newTextAreaText = dashcode.getLocalizedString( dashcodePartSpecs.audioPlayerVolumeCaption.text );
	newTextAreaText = newTextAreaText.replace( /%i/, Math.ceil( g_audioVolume * 9.01 ) );
	textAreaToChange.innerText = newTextAreaText;

	var doAnnounceIndicator = document.getElementById("doAnnounce");

	if ( g_audioVolume ) {
		doAnnounceIndicator.style.background = "url( Images/Announce.png ) no-repeat 0 0"
	} else {
		doAnnounceIndicator.style.background = "url( Images/Announce.png ) no-repeat 0 -20px";
	}
	
	UIentitle();
}

/*
function UIaudioDragDrop( EVENT )
{
	debug( "UIaudioDragDrop( " + EVENT + " )" );

	var uriList = getFilesFromEvent( EVENT, true );
	g_customAudio = uriList;
	document.getElementById("audioPlayerDropBox").style.background = "url( Images/dropWell.png ) no-repeat 0 -132px"
	
	EVENT.stopPropagation();
	EVENT.preventDefault();
}
*/

function UIfocusAudio()
{
	var dropBox = document.getElementById("audioPlayerDropBox");
	g_focusAudio = true;
	
	if ( g_customAudio ) {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat -44px -132px";
	} else {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat -44px 0";
	}
}

function UIblurAudio()
{
	var dropBox = document.getElementById("audioPlayerDropBox");
	g_focusAudio = false;
	
	if ( g_customAudio ) {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat 0 -132px";
	} else {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat 0 0";
	}
}

function UIresetAudio()
{
	var dropBox = document.getElementById("audioPlayerDropBox");
	dropBox.style.background = "url( Images/dropWell.png ) no-repeat 0 0"
	
	delete g_customAudio;
	g_customAudio = null;
	UIblurAudio();
}

function UIaudioDragEnter( EVENT )
{
	document.getElementById( "audioPlayerDropBox" ).style.background = "url( Images/dropWell.png ) no-repeat 0 -88px"

	EVENT.stopPropagation();
	EVENT.preventDefault();
}

function UIaudioDragOver( EVENT )
{
	EVENT.stopPropagation();
	EVENT.preventDefault();
}

function UIaudioDragLeave( EVENT )
{
	var dropBox = document.getElementById("audioPlayerDropBox");

	if ( g_customAudio ) {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat 0 -132px"
	} else {
		dropBox.style.background = "url( Images/dropWell.png ) no-repeat 0 0"
	}

	if ( EVENT ) {	//make it not conflict with loading preferences
		EVENT.stopPropagation();
		EVENT.preventDefault();
	}
}

function UIplayAudio()
{
	debug( "UIplayAudio()" );

	if ( !g_audioVolume ) {
		return false;
	}

	var random = 0;
	var newContentURL;
	
	if ( g_customAudio ) {
		if ( g_customAudio.length > 1 ) {
			do {
				random = Math.floor( Math.random() * g_customAudio.length );
			} while ( random == g_UIpreviousAudio );

			g_UIpreviousAudio = random;

			newContentURL = g_customAudio[random];
		} else {
			newContentURL = g_customAudio[0];
		}
		
		newContentURL = newContentURL.match( /file:\/\/localhost(.*)/ );
		debug( "before : " + decodeURI( newContentURL[1] ) );
		debug( "decode : " + decodeURI( newContentURL[1] ) );
		debug( "unescape : " + unescape( newContentURL[1] ) );
		newContentURL = decodeURI( newContentURL[1] );
	} else {
		do {
			random = Math.floor( Math.random() * 3 );
		} while ( random == g_UIpreviousAudio );

		g_UIpreviousAudio = random;

		newContentURL = g_UIaudioRestore + dashcode.getLocalizedString( "«en.lproj/»" ) + random + ".m4a";
	}
	
	debug( newContentURL );
	
	MailWidgetPlugin.playAudio( newContentURL, g_audioVolume );
}



/*********/
/* Growl */
/*********/

function UIgrowlAnnouncement( COUNT, FROM, SUBJECT ) {
	debug( "UIgrowlAnnouncement( "+COUNT+", "+FROM+", "+SUBJECT+" )" );
	
	FROM = FROM.replace( /\\/g, "\\\\" );
	FROM = FROM.replace( /"/g, "\\\"" );
	SUBJECT = SUBJECT.replace( /\\/g, "\\\\" );
	SUBJECT = SUBJECT.replace( /"/g, "\\\"" );
	
	if ( g_growl ) {
		MailWidgetPlugin.growl( dashcode.getLocalizedString( "«New Mail»" ) + " (" + COUNT + ")", dashcode.getLocalizedString( "«From»" ) + ": " + FROM + "\n" + dashcode.getLocalizedString( "«Subject»" ) + ": " + SUBJECT );
	}
}

function UIgoToGrowl()
{
	debug( "UIgoToGrowl()" );
	
	widget.openURL( "http://www.growl.info/" );
}

function UIsetGrowl( STATE )
{
	debug( "UIsetGrowl("+ STATE +")" );
	var growlCheckboxButton = document.getElementById("growlCheckboxButton");
	growlCheckboxButton.checked = STATE;
	UIchangeGrowl();
}

function UIchangeGrowl()
{
	var growlCheckboxButton = document.getElementById("growlCheckboxButton");
	g_growl = growlCheckboxButton.checked;

	var doGrowlIndicator = document.getElementById( "doGrowl" );

	if ( g_growl ) {
		doGrowlIndicator.style.background = "url( Images/Growl.png ) no-repeat 0 0";
	} else {
		doGrowlIndicator.style.background = "url( Images/Growl.png ) no-repeat 0 -20px";
	}
}



/**************/
/* AutoUpdate */
/**************/

function UIsetUpdate( STATE )
{
	debug( "UIsetUpdate("+ STATE +")" );
	var updateCheckboxButton = document.getElementById("updateCheckboxButton");
	updateCheckboxButton.checked = STATE;
	UIchangeAutoUpdate();
}

function UIchangeAutoUpdate()
{
	var updateCheckboxButton = document.getElementById("updateCheckboxButton");
	g_autoUpdate = updateCheckboxButton.checked;

	var doAutoUpdateIndicator = document.getElementById( "doAutoUpdate" );

	if ( g_autoUpdate ) {
		doAutoUpdateIndicator.style.background = "url( Images/Update.png ) no-repeat 0 0";
	} else {
		doAutoUpdateIndicator.style.background = "url( Images/Update.png ) no-repeat 0 -20px";
	}
}

function UIsetVersionString( STRING ) {
	document.getElementById( "versionString" ).innerText = STRING;
	UIentitle();
}

function UIentitle() {
	var divs = document.getElementsByTagName( "div" );
	
	for ( var div = 0; div < divs.length; div++ ) {
		if ( divs[div].childNodes.length == 1 ) {
			if ( divs[div].scrollWidth != divs[div].clientWidth ) {
				divs[div].setAttribute( "title", divs[div].childNodes[0].nodeValue );
			} else {
				divs[div].removeAttribute( "title" );
			}
		}
	}
}

function getFilesFromEvent( EVENT )
{
	var uriList;
	
	//Finder files
	var finder = ( EVENT.type == "drop" ) ? EVENT.dataTransfer.getData( "text/uri-list" ) : EVENT.clipboardData.getData( "text/uri-list" );
	
	if ( finder ) {
		uriList = finder.split( "\n" );
		return uriList;
	}
	
	//iTunes
	var iTunes = ( EVENT.type == "drop" ) ? EVENT.dataTransfer.getData( "dyn.agk80w7dzr2" ) : EVENT.clipboardData.getData( "dyn.agk80w7dzr2" );
	
	if ( !iTunes ) {
		iTunes = ( EVENT.type == "drop" ) ? EVENT.dataTransfer.getData( "dyn.ah62d4rv4gk80w7dzr2" ) : EVENT.clipboardData.getData( "dyn.ah62d4rv4gk80w7dzr2" );
	}
	
	if ( iTunes ) {
		iTunes = iTunes.split( "\n" );
		uriList = new Array();
	
		for ( var i = 0; i < iTunes.length; i++ ) {
			if ( iTunes[i].indexOf( "<key>Location</key><string>" ) != -1 ) {
				uriList.push( iTunes[i].substring( iTunes[i].indexOf( "file://" ), iTunes[i].indexOf( "</string>" ) ) );
			}
		}
		
		return uriList;
	}
	
	throw Error( "No files available!" );
}
