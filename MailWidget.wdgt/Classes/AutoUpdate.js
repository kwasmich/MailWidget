//UPDATE_INTERVAL is an integer which specifies the checking interval in miliseconds
//UPDATE_LINK must provide an URL to a XML file
//ASK_USER must be a function that asks the user whether update or not : ask( version, link, performUpdate )
//		it must then call performUpdate with either true or false;
//REPORT_CURRENT_VERSION_STRING reports the current version string
//public commands are void checkNow()

function kwasiAutoUpdate( UPDATE_INTERVAL, UPDATE_LINK, ASK_USER, REPORT_CURRENT_VERSION_STRING ) {
	var currentVersion = null;
	var version = null;
	var link = null;
	var file = null;
	var updateTimer = null;

	{
		widget.system( "/bin/rm -R MailWidgetPlugin.widgetplugin.old;", null );
		REPORT_CURRENT_VERSION_STRING( getKeyValue( "Info.plist", "CFBundleShortVersionString" ) );
		currentVersion = parseFloat( getKeyValue( "Info.plist", "CFBundleVersion" ) );

		debug( "currentVersion : " + currentVersion );

		check();
	}

	function debug( STRING ) {
		_debug( "kwasiAutoUpdate : " + STRING );
	}

	this.checkNow = function() {
		currentVersion = parseFloat( getKeyValue( "Info.plist", "CFBundleVersion" ) );
		check();
	};

	function check() {
		debug( "checking..." );

		clearTimeout( updateTimer );
		updateTimer = null;
		var updateInformation = loadXML( UPDATE_LINK );

		if ( updateInformation ) {
			version = parseFloat( updateInformation.getElementsByTagName("version")[0].firstChild.nodeValue );
			link = updateInformation.getElementsByTagName("link")[0].firstChild.nodeValue;
			file = updateInformation.getElementsByTagName("file")[0].firstChild.nodeValue;
			debug( "version : " + version );
			debug( "link : " + link );
			debug( "file : " + file );

			if ( version > currentVersion ) {
				debug( "checkForUpdate : we need to update" );

				ASK_USER( version, link, update );
			} else {
				//delete gAU;	//fix me : dunno how to reference
			}
		} else {
			//delete gAU;	//fix me : dunno how to reference
		}

		updateTimer = setTimeout( check, UPDATE_INTERVAL ); //check every 12 hours
	}

	function loadXML( URL ) {
		var xmlHttp = new XMLHttpRequest();

		try {
			xmlHttp.open( "GET", URL, false );
			xmlHttp.setRequestHeader( "Cache-Control", "no-cache" );
			xmlHttp.send( null );

			if ( xmlHttp.readyState == 4 ) {
				if ( xmlHttp.status == 200 ) {
					return xmlHttp.responseXML;
				} else {
					debug( "loadXML : status is " + xmlHttp.status );
					return false;
				}
			} else {
				debug( "loadXML : readyState is " + xmlHttp.readyState );
				return false;
			}
		} catch(e) {
			debug( e );
			return false;
		}
	}

	function getKeyValue( PLIST, KEY ) {
		var xmlHttp = new XMLHttpRequest();

		try {
			xmlHttp.open("GET", PLIST, false);
			xmlHttp.send(null);

			if ( xmlHttp.readyState == 4 ) {
				var xml = xmlHttp.responseXML;
				var keyValue = null;
				var nodes = xml.getElementsByTagName( "dict" )[0].childNodes;

				for ( var i=0; i < nodes.length; i++ ) {
					if ( (nodes[i].nodeType == 1) && (nodes[i].tagName.toLowerCase() == "key") && (nodes[i].firstChild.data == KEY) ) {
						if ( nodes[i+2].tagName.toLowerCase() != "array" ) {
							keyValue = nodes[i+2].firstChild.data;
						} else {
							keyValue = new Array();
							var arNodes = nodes[i+2].childNodes;

							for ( var j=0; j < arNodes.length; j++ ) {
								if ( arNodes[j].nodeType == 1 ) {
									keyValue.push(arNodes[j].firstChild.data);
								}
							}
						}

						break;
					}
				}

				return keyValue;
			} else {
				debug( "loadXML : readyState is " + xmlHttp.readyState );
				return false;
			}
		} catch(e) {
			debug( e );
		}
	}

	function update( CALLBACK_AFTER_UPDATE ) {
		if ( CALLBACK_AFTER_UPDATE ) {
			debug( "Updating..." );

			widget.system( "/usr/bin/curl " + file + " -o AutoUpdate.tgz -s;/bin/mv MailWidgetPlugin.widgetplugin MailWidgetPlugin.widgetplugin.old;/usr/bin/tar zxvf AutoUpdate.tgz;/bin/rm AutoUpdate.tgz;killall -HUP Dock;", null );
			//CALLBACK_AFTER_UPDATE();
		} else {
			debug( "skipping this version" );
			currentVersion = version;
		}
	}
}
