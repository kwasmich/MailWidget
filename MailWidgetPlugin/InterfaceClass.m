//
//  InterfaceClass.m
//  MailWidgetPlugin
//
//  Created by Michael Kwasnicki on 2009-09-15.
//  Copyright 2009 Kwasi. All rights reserved.
//

#import "InterfaceClass.h"

#import <iso646.h>

#ifndef DEBUG
#define NSLog(...)
#endif

@implementation InterfaceClass

#pragma mark Widget Plug-in Interface Implementation

- (id) initWithWebView: (WebView*) webview {
	self = [super init];
	
	if ( self ) {
		[GrowlApplicationBridge setGrowlDelegate:self];
		mAppleMail = [SBApplication applicationWithBundleIdentifier:@"com.apple.mail"];
        [mAppleMail retain];
        
		NSArray* appList = [[NSWorkspace sharedWorkspace] launchedApplications];
		
		for ( NSDictionary* app in appList ) {
			NSString* appBundleID = [app objectForKey:@"NSApplicationBundleIdentifier"];
			
			if ( [appBundleID isEqualToString:@"com.apple.mail"] ) {
				[self performSelector:@selector( mailAlreadyRunning ) withObject:nil afterDelay:3];	//we have to wait unitl the JS part is fully loaded
				break;
			}
		}
		
		[[[NSWorkspace sharedWorkspace] notificationCenter]
		 addObserver: self
		 selector: @selector(receiveAppLaunchNote:)
		 name: NSWorkspaceDidLaunchApplicationNotification
		 object: nil];
		[[[NSWorkspace sharedWorkspace] notificationCenter]
		 addObserver: self
		 selector: @selector(receiveAppTerminatedNote:)
		 name: NSWorkspaceDidTerminateApplicationNotification
		 object: nil];
		
		[[[NSWorkspace sharedWorkspace] notificationCenter]
		 addObserver: self
		 selector: @selector(receiveSleepNote:)
		 name: NSWorkspaceWillSleepNotification
		 object: NULL];
		[[[NSWorkspace sharedWorkspace] notificationCenter]
		 addObserver: self
		 selector: @selector(receiveWakeNote:)
		 name: NSWorkspaceDidWakeNotification
		 object: NULL];
		
		//not working, Mail does not dispatch Events
		//[[NSDistributedNotificationCenter defaultCenter] addObserver:self selector:@selector(somethingChanged:) name:nil object:nil];
        
        [[NSUserNotificationCenter defaultUserNotificationCenter] setDelegate:self];
	}
	
	return self;
}

/*Assigns the JavaScript Object named MailWidgetPlugin in Dashboards WebKit
 as an Interface to this Program*/
- (void) windowScriptObjectAvailable: (WebScriptObject*) windowScriptObject {
	[windowScriptObject setValue:self forKey:@"MailWidgetPlugin"];
	mWebScriptObject = [windowScriptObject retain];
}


	
#pragma mark -
#pragma mark WebScriptObject Protocol Implementation

/*Lookup Table for message to send when the JavaScript Object calls a method*/
+ (NSString*) webScriptNameForSelector: (SEL) aSelector {
	NSString* name = nil;
	
//	if ( aSelector == @selector( myFirstFunction ) ) {
//		name = @"myFirstFunction";
//	} else if ( aSelector == @selector( mySecondFunction: ) ) {
//		name = @"mySecondFunction";
//	} else
	if ( aSelector == @selector( getAppleMailAccounts ) ) {
		name = @"getAppleMailAccounts";
	} else if ( aSelector == @selector( setActiveAccounts: ) ) {
		name = @"setActiveAccounts";
	} else if ( aSelector == @selector( playAudioFile: withVolume: ) ) {
		name = @"playAudio";
	} else if ( aSelector == @selector( growlWithTitle: description: ) ) {
		name = @"growl";
	} else if ( aSelector == @selector( getAppleMailUnreadCount ) ) {
		name = @"getAppleMailUnreadCount";
	} else if ( aSelector == @selector( appleMailLaunchAndCheck ) ) {
		name = @"appleMailLaunchAndCheck";
	} else if ( aSelector == @selector( appleMailCheck ) ) {
		name = @"appleMailCheck";
//	} else if ( aSelector == @selector( callJSFunction ) ) {
//		name = @"callJSFunction";
	} else if ( aSelector == @selector( setPasswordForAccount: to: ) ) {
		name = @"setPassword";
	} else if ( aSelector == @selector( getPasswordForAccount: ) ) {
		name = @"getPassword";
//	} else if ( aSelector == @selector( deletePasswordForAccount: ) ) {
//		name = @"deletePassword";
	} else if ( aSelector == @selector( log: ) ) {
		name = @"log";
	} else {
		//NSLog( @"Error with selector name" );
	}
	
	return name;
}

/*Only expose designated methods to the JavaScript Object*/
+ (BOOL) isSelectorExcludedFromWebScript:(SEL) aSelector {
//	if ( aSelector == @selector( myFirstFunction ) ) {
//		return NO;
//	} else if ( aSelector == @selector( mySecondFunction: ) ) {
//		return NO;
//	} else
	if ( aSelector == @selector( getAppleMailAccounts ) ) {
		return NO;
	} else if ( aSelector == @selector( setActiveAccounts: ) ) {
		return NO;
	} else if ( aSelector == @selector( playAudioFile: withVolume: ) ) {
		return NO;
	} else if ( aSelector == @selector( growlWithTitle: description: ) ) {
		return NO;
	} else if ( aSelector == @selector( getAppleMailUnreadCount ) ) {
		return NO;
	} else if ( aSelector == @selector( appleMailLaunchAndCheck ) ) {
		return NO;
	} else if ( aSelector == @selector( appleMailCheck ) ) {
		return NO;
//	} else if ( aSelector == @selector( callJSFunction ) ) {
//		return NO;
	} else if ( aSelector == @selector( setPasswordForAccount: to: ) ) {
		return NO;
	} else if ( aSelector == @selector( getPasswordForAccount: ) ) {
		return NO;
//	} else if ( aSelector == @selector( deletePasswordForAccount: ) ) {
//		return NO;
	} else if ( aSelector == @selector( log: ) ) {
		return NO;
	} else {
		return YES;
	}
}

/*Keep all instance variables hidden from JavaScript Object*/
+ (NSString*) webScriptNameForKey: (const char*) var {
	return nil;
}

/*Keep all instance variables hidden from JavaScript Object*/
+ (BOOL) isKeyExcludedFromWebScript: (const char*) var {
	return YES;
}

//- (id) invokeUndefinedMethodFromWebScript:(NSString *)name withArguments:(NSArray *)arguments {}

//- (id) invokeDefaultMethodWithArguments:(NSArray *)arguments {}

//- (void) finalizeForWebScript;


#pragma mark - NSUserNotificationCenterDelegate Protocol Implementation


- (void) userNotificationCenter:(NSUserNotificationCenter *)center didActivateNotification:(NSUserNotification *)notification {
    if (notification.activationType == NSUserNotificationActivationTypeContentsClicked) {
        [self appleMailLaunchAndCheck];
    }
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center shouldPresentNotification:(NSUserNotification *)notification{
    return YES;
}



#pragma mark - Growl Application Bridge Delegate Protocol Implementation

- (NSDictionary*) registrationDictionaryForGrowl {
	NSArray* registerMe = [NSArray arrayWithObject: @"MailWidgetGrowlNewMail"];
	NSDictionary* growlReg = [NSDictionary dictionaryWithObjectsAndKeys: registerMe, GROWL_NOTIFICATIONS_ALL, registerMe, GROWL_NOTIFICATIONS_DEFAULT, nil];
	return growlReg;
}

- (NSString*) applicationNameForGrowl {
	return @"MailWidget";
}

- (NSImage*) applicationIconForGrowl {
	NSBundle* thisPlugin = [NSBundle bundleWithIdentifier:@"de.kwasi-ich.MailWidgetPlugin"];
	NSString* pathToIcon = [[[thisPlugin resourcePath] stringByAppendingString:@"/../../../Icon.png"] stringByStandardizingPath];
	NSImage* growlIcon = [[NSImage alloc] initByReferencingFile:pathToIcon];
    mGrowlIcon = [[growlIcon TIFFRepresentation] retain];
	return [growlIcon autorelease];
}

//- (NSData*) applicationIconDataForGrowl {}

//- (void) growlIsReady {}

- (void) growlNotificationWasClicked: (id) clickContext {
	[self appleMailLaunchAndCheck];
}

//- (void) growlNotificationTimedOut: (id) clickContext {}


#pragma mark -
#pragma mark Host Reachability Delegate Protocol Implementation

- (void) reachabilityChangedForHost:(NSString*) hostName_ to:(BOOL) reachable_ {
//	NSLog( @"%@ %i", hostName_, reachable_ );
//	[self evaluateJS:@"connectivity( true );"];
	[self reachabilityChanged];
}

#pragma mark -


- (void) dealloc {
	[self clearConnectionMonitoring];
	[mAppleMail release];
	[mActiveAppleMailAccounts release];
	[mWebScriptObject release];
	[mReachableHosts release];
	[[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver: self];
    [mGrowlIcon release];
	//[[NSNotificationCenter defaultCenter] removeObserver:self];
	[super dealloc];
}

//- (NSString*) myFirstFunction {
//	NSLog( @"%@", [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0]]];
//	[self network];
//	return @"test 1";
//}

//- (NSArray*) mySecondFunction: (int) number {
//	//NSArray* myArray = [NSArray array];
//	NSMutableArray* myArray = [NSMutableArray array];
//	
//	for ( int i = 0; i < number; i++ ) {
//		[myArray addObject: @"test"];
//	}
//	
//	return [NSArray arrayWithArray:myArray];
//}

- (void) setActiveAccounts: (WebScriptObject*) jsArray {
	NSMutableArray* myArray = [NSMutableArray array];
	unsigned int acc = 0;
	
	while ( true ) {
		if ( [[[jsArray webScriptValueAtIndex:acc] className] isEqualToString:@"WebUndefined"] ) {
			break;
		}
		
		[myArray addObject:[jsArray webScriptValueAtIndex:acc]];
		NSLog( @"MailWidget : %@", [jsArray webScriptValueAtIndex:acc] );
		acc++;
	}
	
	NSArray* nsArray = [NSArray arrayWithArray:myArray];
	NSLog( @"MailWidget : %@", nsArray );
	[self clearConnectionMonitoring];
	[mActiveAppleMailAccounts release];
	mActiveAppleMailAccounts = [nsArray retain];
	[self setupConnectionMonitoring];
}

- (void) playAudioFile: (NSString*) path withVolume: (float) volume {
	NSSound* audio = [[NSSound alloc] initWithContentsOfFile:path byReference:YES];
	[audio setVolume:volume];
	[audio play];
	//[[NSSound soundNamed:@"Tink"] play];
	[audio release];
}

- (NSArray*) getAppleMailAccounts {
    NSMutableArray* acceptedAccounts = [NSMutableArray array];
	NSString* exchangeErrorDesc = nil;
	NSPropertyListFormat exchangeFormat;
	NSData* exchangePListXML = nil;
	NSDictionary* exchangePList = nil;
	NSString* mailErrorDesc = nil;
	NSPropertyListFormat mailFormat;
	
	NSString* path = [@"~/Library/Preferences/com.apple.mail.plist" stringByExpandingTildeInPath];
	NSString* pathLion = [@"~/Library/Mail/V2/MailData/Accounts.plist" stringByExpandingTildeInPath];
	
	if ( [[NSFileManager defaultManager] fileExistsAtPath:pathLion] ) {
		path = pathLion;
	}
	
	NSData* mailPListXML = [[NSFileManager defaultManager] contentsAtPath:path];
	NSDictionary* mailPList = (NSDictionary*)[NSPropertyListSerialization propertyListFromData:mailPListXML mutabilityOption:NSPropertyListImmutable format:&mailFormat errorDescription:&mailErrorDesc];
	
	if (not mailPList) {
		NSLog( @"MailWidget : Error reading plist: %@, format: %lu", mailErrorDesc, mailFormat );
		return nil;
	}
	
	NSArray* mailAccounts = [mailPList objectForKey:@"MailAccounts"];
	NSString* accountName = nil;
	NSString* accountPath = nil;
	NSString* accountType = nil;
	NSString* authenticationSheme = nil;
	NSString* hostName = nil;
	NSString* internalServerPath = nil;
	id rawPortNumber = nil;
	id rawSSLEnabled = nil;
	NSString* userName = nil;
	NSString* uniqueId = nil;
	
	NSInteger portNumber = 0;
	BOOL sslEnabled = NO;
	
	//NSUInteger trueAccountCount = 0;
	
	for ( NSDictionary* eachMailAccount in mailAccounts ) {
		accountName = [eachMailAccount valueForKey:@"AccountName"];
		accountPath = [eachMailAccount valueForKey:@"AccountPath"];
		accountType = [eachMailAccount valueForKey:@"AccountType"];
		authenticationSheme = [eachMailAccount valueForKey:@"AuthenticationScheme"];
		hostName = [eachMailAccount valueForKey:@"Hostname"];
		internalServerPath = [eachMailAccount valueForKey:@"InternalServerPath"];
		rawPortNumber = [eachMailAccount valueForKey:@"PortNumber"];
		rawSSLEnabled = [eachMailAccount valueForKey:@"SSLEnabled"];
		userName = [eachMailAccount valueForKey:@"Username"];
		uniqueId = [eachMailAccount valueForKey:@"uniqueId"];
		
		if ( not accountName or [accountName isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing AccountName" );
			continue;
		}
		
		if ( not accountPath or [accountPath isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing AccountPath" );
			continue;
		}
		
		if ( not uniqueId or [uniqueId isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing uniqueId" );
			continue;
		}
		
		if ( [rawSSLEnabled isKindOfClass:[NSString class]] ) {
			if ( [(NSString*) rawSSLEnabled isEqualToString:@"YES"] ) {
				sslEnabled = YES;
			} else {
				sslEnabled = NO;
			}
		} else if ( [rawSSLEnabled isKindOfClass:[NSNumber class]] ) {
			sslEnabled = [(NSNumber*) rawSSLEnabled boolValue];
		} else {
			sslEnabled = NO;
		}
		
		if ( [rawPortNumber isKindOfClass:[NSString class]] ) {
			NSNumberFormatter* numberFormatter = [[NSNumberFormatter alloc] init];
			[numberFormatter setNumberStyle:NSNumberFormatterDecimalStyle];
			NSNumber* parsedNumber = [numberFormatter numberFromString:rawPortNumber];
			portNumber = [parsedNumber integerValue];
			[numberFormatter release];
		} else if ( [rawPortNumber isKindOfClass:[NSNumber class]] ) {
			portNumber = [(NSNumber*) rawPortNumber integerValue];
		} else {
			portNumber = 0;
		}
        
		if ( [accountType isEqualToString:@"POPAccount"] ) {
			if ( portNumber == 0 ) {
				if ( sslEnabled ) {
					portNumber = 995;
				} else {
					portNumber = 110;
				}
			}
		} else if ( [accountType isEqualToString:@"IMAPAccount"] or [accountType isEqualToString:@"iToolsAccount"] or [accountType isEqualToString:@"AosImapAccount"] or [accountType isEqualToString:@"ExchangeAccount"] or [accountType isEqualToString:@"ExchangeIMAPAccount"] ) {
			if ( portNumber == 0 ) {
				if ( sslEnabled ) {
					portNumber = 993;
				} else {
					portNumber = 143;
				}
			}
			
			if ( [accountType isEqualToString:@"iToolsAccount"] ) {
				hostName = @"imap.mail.me.com";
			} else if ( [accountType isEqualToString:@"AosImapAccount"] ) {
					hostName = @"imap.mail.me.com";
			} else if ( [accountType isEqualToString:@"ExchangeAccount"] or [accountType isEqualToString:@"ExchangeIMAPAccount"] ) {
				NSString* exchangePath = [@"~/Library/Preferences/com.apple.IISSupport.plist" stringByExpandingTildeInPath];
                NSString* exchangePathLion = [@"~/Library/Containers/com.apple.mail/Data/Library/Preferences/com.apple.IISSupport.plist" stringByExpandingTildeInPath];
                
                if ( [[NSFileManager defaultManager] fileExistsAtPath:exchangePathLion] ) {
                    exchangePath = exchangePathLion;
                }
                
                exchangePListXML = [[NSFileManager defaultManager] contentsAtPath:exchangePath];
				exchangePList = (NSDictionary*)[NSPropertyListSerialization  propertyListFromData:exchangePListXML mutabilityOption:NSPropertyListMutableContainersAndLeaves format:&exchangeFormat errorDescription:&exchangeErrorDesc];
				
				if (not exchangePList) {
					NSLog( @"MailWidget : Error reading plist: %@, format: %lu", exchangeErrorDesc, exchangeFormat );
					continue;
				}
				
				hostName = [exchangePList valueForKey:@"ExchangeServerHostname"];
				userName = [exchangePList valueForKey:@"IISUser"];
			}
		} else if ( [accountType isEqualToString:@"EWSAccount"] ) {
			if ( portNumber == 0 ) {
				if ( sslEnabled ) {
					portNumber = 443;
				} else {
					portNumber = 80;
				}
				
				authenticationSheme = @"NTLM";
			}
		} else {
			NSLog( @"MailWidget : unknown AccountType" );
			continue;
		}
		
		if ( not authenticationSheme ) {
			authenticationSheme = @"PLAIN";
		} else {
			if ( [authenticationSheme isEqualToString:@"CRAM-MD5"] ) {
				authenticationSheme = @"CRAM-MD5";
			} else if ( [authenticationSheme isEqualToString:@"NTLM"] ) {
				authenticationSheme = @"NTLM";
                //} else if ( [authenticationSheme isEqualToString:@"X-APOP"] ) {
                //	authenticationSheme = @"X-APOP";
			} else {
				authenticationSheme = @"PLAIN";
			}
		}
		
		if ( not hostName or [hostName isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing Hostname" );
			continue;
		}
		
		if ( not userName or [userName isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing Username" );
			continue;
		}
		
		if ( not internalServerPath ) {
			NSLog( @"MailWidget : missing Username" );
			internalServerPath = @"";
		}
		
		[acceptedAccounts addObject: accountName];
		[acceptedAccounts addObject: accountPath];
		[acceptedAccounts addObject: accountType];
		[acceptedAccounts addObject: authenticationSheme];
		[acceptedAccounts addObject: hostName];
		[acceptedAccounts addObject: internalServerPath];
		[acceptedAccounts addObject: [NSNumber numberWithInteger:portNumber]];
		[acceptedAccounts addObject: [NSNumber numberWithBool:sslEnabled]];
		[acceptedAccounts addObject: userName];
		[acceptedAccounts addObject: uniqueId];
		
		NSLog( @"MailWidget : AccountName : %@", accountName );
		NSLog( @"MailWidget : AccountPath : %@", accountPath );
		NSLog( @"MailWidget : AccountType : %@", accountType );
		NSLog( @"MailWidget : AuthenticationScheme : %@", authenticationSheme );
		NSLog( @"MailWidget : Hostname : %@", hostName );
		NSLog( @"MailWidget : InternalServerPath : %@", internalServerPath );
		NSLog( @"MailWidget : PortNumber : %i", portNumber );
		NSLog( @"MailWidget : SSLEnabled : %i", sslEnabled );
		NSLog( @"MailWidget : Username : %@", userName );
		NSLog( @"MailWidget : uniqueId : %@", uniqueId );
		
		//trueAccountCount++;
	}
	
	//NSLog( @"Found %u valid accounts", trueAccountCount]];
	return [NSArray arrayWithArray:acceptedAccounts];
}

/*
- (void) network {
	NSHost* host = [NSHost hostWithName:@"mx.freenet.de"];
	NSInputStream* input = nil;
	NSOutputStream* output = nil;
	//NSStream* session = [NSStream alloc];
	//[session getStreamsToHost:host port:143 inputStream:&input outputStream:&output];
	[NSStream getStreamsToHost:host port:143 inputStream:&input outputStream:&output];
	
	if (input == nil or output == nil) {
		NSLog( @"MailWidget : Unable to open streams." );
		return;
	} else {
		NSLog( @"MailWidget : Succes. we are connected, what now?" );
	}
	
//	[input setDelegate:self];
//	[output setDelegate:self];
//	
//	[input scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
//	[output scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
//	
//	[input open];
//	[output open];
	
	//NSNetService
	//NSStream
	//NSSocketPort ?
}
*/

- (void) growlWithTitle: (NSString*) title description: (NSString*) description {
    Class mlNotificationCenter = NSClassFromString (@"NSUserNotificationCenter");
    
    if ( mlNotificationCenter ) {
        NSUserNotification* notification = [[NSUserNotification alloc] init];
        notification.title = title;
        notification.informativeText = description;
        notification.soundName = nil; //NSUserNotificationDefaultSoundName;
        [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:notification];
        [notification release];
    } else {
        [GrowlApplicationBridge notifyWithTitle: title description: description notificationName: @"MailWidgetGrowlNewMail" iconData: mGrowlIcon priority: 0 isSticky: NO clickContext: @"MailWidgetGrowlNewMail"];
    }
}

- (NSArray*) getAppleMailUnreadCount {
	if ( [mAppleMail isRunning] == NO ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:-1]];
	}
	
	NSInteger totalUnreadCount = [[mAppleMail inbox] unreadCount];
	
	if ( totalUnreadCount == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	NSInteger unreadMonitoredCount = 0;
	
	NSMutableArray* unreadMonitoredMails = [NSMutableArray array];
	
	NSPredicate* readStatusTest = [NSPredicate predicateWithFormat:@"readStatus == NO"];
	
	for ( NSString* eachAccount in mActiveAppleMailAccounts ) {
		MailAccount* eachActiveAccount = [[mAppleMail accounts] objectWithName:eachAccount];
//		NSLog( @"eachAccount %@", [eachActiveAccount name] );
		MailMailbox* mailBox = [(MailMailbox*)[[eachActiveAccount mailboxes] objectWithName:@"INBOX"] get];
		
//		NSLog( @"mailBox %@", mailBox );
		
		if ( mailBox ) {
			NSInteger mailBoxUnreadCount = [mailBox unreadCount];
//			NSLog( @"mailBoxCount %i", mailBoxUnreadCount );
			
			if ( mailBoxUnreadCount > 0 ) {
				NSArray* unreadMails = [[mailBox messages] filteredArrayUsingPredicate:readStatusTest];
				unreadMonitoredCount += mailBoxUnreadCount;
				[unreadMonitoredMails addObject:[(MailMessage*)[unreadMails objectAtIndex:0] get]];
			}
		} else {
//			NSLog( @"[eachActiveAccount mailboxes] %@", [[eachActiveAccount mailboxes] get] );
			
			for ( MailMailbox* eachMailBox in [eachActiveAccount mailboxes] ) {
//				NSLog( @"eachMailBox %@", [eachMailBox get] );
				NSInteger mailBoxUnreadCount = [eachMailBox unreadCount];
//				NSLog( @"mailBoxCount %i", mailBoxUnreadCount );
				
				if ( mailBoxUnreadCount > 0 ) {
//					NSLog( @"yeap" );
					NSArray* unreadMails = [[eachMailBox messages] filteredArrayUsingPredicate:readStatusTest];
					unreadMonitoredCount += mailBoxUnreadCount;
					[unreadMonitoredMails addObject:[(MailMessage*)[unreadMails objectAtIndex:0] get]];
				}
			}
		}
	}
	
//	NSLog( @"unreadMonitoredMails %@", unreadMonitoredMails );
	
	MailMessage* mostRecent = [unreadMonitoredMails objectAtIndex:0];
	
	for ( NSUInteger currentMessage = 0; currentMessage < [unreadMonitoredMails count]; currentMessage++ ) {
		if ( [[[unreadMonitoredMails objectAtIndex: currentMessage] dateSent] compare: [mostRecent dateSent]] == 1 ) {
			mostRecent = [unreadMonitoredMails objectAtIndex: currentMessage];
		}
	}
	
//	NSLog( @"mostRecent %@", mostRecent );
	
	NSMutableArray* recentMailHeader = [NSMutableArray array];
	[recentMailHeader addObject: [NSNumber numberWithInteger:unreadMonitoredCount]];
	[recentMailHeader addObject: [mAppleMail extractNameFrom:[mostRecent sender]]];
	[recentMailHeader addObject: [mostRecent subject]];
	[recentMailHeader addObject: [mostRecent dateSent]];
	[recentMailHeader addObject: [[[mostRecent mailbox] account] name]];
	return [NSArray arrayWithArray:recentMailHeader];
}
/*
- (NSArray*) getAppleMailUnreadCount1 {
	if ( [appleMail isRunning] == NO ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:-1]];
	}
	
	NSUInteger totalUnreadCount = [[appleMail inbox] unreadCount];
	
	if ( totalUnreadCount == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	NSMutableArray* unreadMails = [NSMutableArray array];
	
	for ( NSString* eachActiveAccount in activeAppleMailAccounts ) {
		MailMailbox* mailBox = [[[[appleMail accounts] objectWithName:eachActiveAccount] mailboxes]objectWithName:@"INBOX"];
		NSUInteger mailBoxCount = [[mailBox messages] count];
		NSUInteger mailBoxUnreadCount = [mailBox unreadCount];
		
		if ( not [mailBox unreadCount] ) {
			continue;
		}
		
		NSString* accountPath = [[[[appleMail accounts] objectWithName:eachActiveAccount] accountDirectory] path];
		
		NSArray* inboxMailsReadStatus = [[mailBox messages] arrayByApplyingSelector: @selector( readStatus )]; //this wraps the BOOL into an NSNumber (NSCFBoolean is private subclass)
		
		NSUInteger monitoredUnreadCount = 0;
		
		for ( NSUInteger currentMessage = 0; currentMessage < mailBoxCount; currentMessage++ ) {
			if ( [[inboxMailsReadStatus objectAtIndex: currentMessage] boolValue] == NO ) {
				NSString* unreadAccountPath = [[[[[[mailBox messages] objectAtIndex: currentMessage] mailbox] account] accountDirectory] path];
				
				if ( [unreadAccountPath isEqualToString:accountPath] ) {
					[unreadMails addObject: [[mailBox messages] objectAtIndex: currentMessage]];
					monitoredUnreadCount++;
				}
			}
			
			if ( monitoredUnreadCount == mailBoxUnreadCount ) {
				break;
			}
		}
	}
		
	if ( [unreadMails count] == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	MailMessage* mostRecent = [unreadMails objectAtIndex:0];
	
	for ( NSUInteger currentMessage = 0; currentMessage < [unreadMails count]; currentMessage++ ) {
		if ( [[[unreadMails objectAtIndex: currentMessage] dateSent] compare: [mostRecent dateSent]] == 1 ) {
			mostRecent = [unreadMails objectAtIndex: currentMessage];
		}
	}
	
	NSMutableArray* recentMailHeader = [NSMutableArray array];
	[recentMailHeader addObject: [NSNumber numberWithInteger:[unreadMails count]]];
	[recentMailHeader addObject: [appleMail extractNameFrom:[mostRecent sender]]];
	[recentMailHeader addObject: [mostRecent subject]];
	[recentMailHeader addObject: [mostRecent dateSent]];
	[recentMailHeader addObject: [[[mostRecent mailbox] account] name]];
	return [NSArray arrayWithArray:recentMailHeader];
}

- (NSArray*) getAppleMailUnreadCount2 {
	if ( [appleMail isRunning] == NO ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:-1]];
	}
	
	if ( [[appleMail inbox] unreadCount] == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	SBElementArray* inboxMails = [[appleMail inbox] messages];
	
	NSArray* unreadMails = [inboxMails filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"readStatus == NO"]];
	
	NSMutableArray* unreadMonitoredMails = [NSMutableArray array];
	
	for ( MailMessage* currentMessage in unreadMails ) {
		NSString* unreadAccountPath = [[[[currentMessage mailbox] account] accountDirectory] path];
		//NSLog( @"currentMessageAccountPaht : %@", unreadAccountPath );
		
		
		NSLog( @"account : %@", currentMessage );
		
		BOOL isMonitored = NO;
		
		for ( NSString* eachActiveAccount in activeAppleMailAccounts ) {
			MailAccount* checkMe = [[appleMail accounts] objectWithName:eachActiveAccount];
			
			if ( [unreadAccountPath isEqualToString:[[checkMe accountDirectory] path]] ) {
				isMonitored = YES;
				break;
			}
			
		}
		
		if ( isMonitored ) {
			[unreadMonitoredMails addObject: currentMessage];
		}
	}
	
	NSLog( @"account : %@", unreadMonitoredMails );
	
	if ( [unreadMonitoredMails count] == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	MailMessage* mostRecent = [unreadMonitoredMails objectAtIndex:0];
	
	for ( NSUInteger currentMessage = 0; currentMessage < [unreadMonitoredMails count]; currentMessage++ ) {
		if ( [[[unreadMonitoredMails objectAtIndex: currentMessage] dateSent] compare: [mostRecent dateSent]] == 1 ) {
			mostRecent = [unreadMonitoredMails objectAtIndex: currentMessage];
		}
	}
	
	NSMutableArray* recentMailHeader = [NSMutableArray array];
	[recentMailHeader addObject: [NSNumber numberWithInteger:[unreadMonitoredMails count]]];
	[recentMailHeader addObject: [appleMail extractNameFrom:[mostRecent sender]]];
	[recentMailHeader addObject: [mostRecent subject]];
	[recentMailHeader addObject: [mostRecent dateSent]];
	[recentMailHeader addObject: [[[mostRecent mailbox] account] name]];
	
	return [NSArray arrayWithArray:recentMailHeader];
}

- (NSArray*) getAppleMailUnreadCount3 {
	if ( [appleMail isRunning] == NO ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:-1]];
	}
	
	NSUInteger totalUnreadCount = [[appleMail inbox] unreadCount];
	
	if ( totalUnreadCount == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	NSMutableArray* unreadMails;
	MailMessage* mostRecent;
	
	for ( int i = 0; i < 200; i++ ) {
	
	unreadMails = [NSMutableArray array];
	
	for ( NSString* eachActiveAccount in activeAppleMailAccounts ) {
		MailMailbox* mailBox = [[[[appleMail accounts] objectWithName:eachActiveAccount] mailboxes]objectWithName:@"INBOX"];
		NSUInteger mailBoxUnreadCount = [mailBox unreadCount];
		
		if ( not [mailBox unreadCount] ) {
			continue;
		}
		
		NSString* accountPath = [[[[appleMail accounts] objectWithName:eachActiveAccount] accountDirectory] path];
		
		NSArray* unreadMailBoxMails = [[mailBox messages] filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"readStatus == NO"]];
				
		//NSArray* inboxMailsReadStatus = [[mailBox messages] arrayByApplyingSelector: @selector( readStatus )]; //this wraps the BOOL into an NSNumber (NSCFBoolean is private subclass)
		
		NSUInteger monitoredUnreadCount = 0;
		
		for ( MailMessage* currentMessage in unreadMailBoxMails ) {
			NSString* unreadAccountPath = [[[[currentMessage mailbox] account] accountDirectory] path];
			
			if ( [unreadAccountPath isEqualToString:accountPath] ) {
				[unreadMails addObject: currentMessage];
				monitoredUnreadCount++;
			}
			
			if ( monitoredUnreadCount == mailBoxUnreadCount ) {
				break;
			}
		}
	}
	
	NSLog( @"account : %@", unreadMails );
	
	if ( [unreadMails count] == 0 ) {
		return [NSArray arrayWithObject: [NSNumber numberWithInt:0]];
	}
	
	mostRecent = [unreadMails objectAtIndex:0];
	
	for ( NSUInteger currentMessage = 0; currentMessage < [unreadMails count]; currentMessage++ ) {
		if ( [[[unreadMails objectAtIndex: currentMessage] dateSent] compare: [mostRecent dateSent]] == 1 ) {
			mostRecent = [unreadMails objectAtIndex: currentMessage];
		}
	}
	}
	
	NSMutableArray* recentMailHeader = [NSMutableArray array];
	[recentMailHeader addObject: [NSNumber numberWithInteger:[unreadMails count]]];
	[recentMailHeader addObject: [appleMail extractNameFrom:[mostRecent sender]]];
	[recentMailHeader addObject: [mostRecent subject]];
	[recentMailHeader addObject: [mostRecent dateSent]];
	[recentMailHeader addObject: [[[mostRecent mailbox] account] name]];
	return [NSArray arrayWithArray:recentMailHeader];
}
*/

- (void) appleMailLaunchAndCheck {
	if ( [mAppleMail isRunning] == YES ) {
		NSUInteger mainWindowCount = [[mAppleMail messageViewers] count];
		
		if ( mainWindowCount == 0 ) {
			NSDictionary* properties = [NSDictionary dictionaryWithObjectsAndKeys:[NSArray arrayWithObject:[mAppleMail inbox]], @"selectedMailboxes", nil];
			MailMessageViewer* mmv = [[[mAppleMail classForScriptingClass:@"message viewer"] alloc] initWithProperties:properties];
			[[mAppleMail messageViewers] addObject:mmv];
            [mmv release];
			NSLog( @"MailWidget : muss aufmachen" );
		} else {
			NSLog( @"MailWidget : muss nicht aufmachen" );
		}
	}
	
	[mAppleMail activate];
	[self appleMailCheck];
}

- (void) appleMailCheck {
	if ( [mAppleMail isRunning] == YES ) {
		//for ( MailAccount* eachAccount in [mail accounts] ) {
		//	NSLog( @"%@", [eachAccount name]]];
		//}
		
		//NSLog( @"%u", [activeAppleMailAccounts count]]];
		
		for ( NSString* eachActiveAccount in mActiveAppleMailAccounts ) {
			//NSLog( @"%@", eachActiveAccount]];
			MailAccount* checkMe = [[mAppleMail accounts] objectWithName:eachActiveAccount];
			[mAppleMail checkForNewMailFor:checkMe];
		}
	}
}

- (void) setPasswordForAccount: (NSString*) account to: (NSString*) password {
	SecKeychainItemRef itemRef;
	OSStatus status = SecKeychainFindGenericPassword( NULL, 10, "MailWidget", (UInt32)[account lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [account UTF8String], NULL, NULL, &itemRef );
	
	if ( errSecItemNotFound == status ) {
		status = SecKeychainAddGenericPassword( NULL, 10, "MailWidget", (UInt32)[account lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [account UTF8String], (UInt32)[password lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [password UTF8String], &itemRef );
	} else {
		status = SecKeychainItemModifyContent( itemRef, NULL, (UInt32)[password lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [password UTF8String] );
	}
	
	if ( status != noErr ) {
		NSLog( @"MailWidget : setPasswordForAccount %ld", status );
	}
}

- (NSString*) getPasswordForAccount: (NSString*) account {
	UInt32 passwordLength = 0;
	void* passwordData = NULL;
	OSStatus status = SecKeychainFindGenericPassword( NULL, 10, "MailWidget", (UInt32)[account lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [account UTF8String], &passwordLength, &passwordData, NULL );
	//OSStatus status = SecKeychainFindInternetPassword( NULL, 12, "kwasi-ich.de", 0, NULL, 8, "m0144d30", 0, NULL, 0, kSecProtocolTypeAny, kSecAuthenticationTypeAny, &passwordLength, &passwordData, NULL );

	if ( status != noErr ) {
		NSLog( @"MailWidget : %lu %s", passwordLength, passwordData );
		NSLog( @"MailWidget : getPassword %ld", status );
		return nil;
	}
	
	NSString* password = [[NSString alloc] initWithBytes: passwordData length: passwordLength encoding: NSUTF8StringEncoding];
	SecKeychainItemFreeContent( NULL, passwordData );
	return [password autorelease];
}

//- (void) deletePasswordForAccount: (NSString*) account {
//	SecKeychainItemRef itemRef;
//	OSStatus status = SecKeychainFindGenericPassword( NULL, 10, "MailWidget", [account lengthOfBytesUsingEncoding: NSUTF8StringEncoding], [account UTF8String], NULL, NULL, &itemRef );
//	
//	if ( errSecItemNotFound != status ) {
//		status = SecKeychainItemDelete( itemRef );
//	}
//	
//	if ( status != noErr ) {
//		NSLog( @"deletePasswordForAccount %i", status]];
//	}
//}

//not working, Mail does not dispatch events
/*- (void)somethingChanged:(NSNotification *)notification {
	NSLog( @"%@", [notification name]]];
	NSLog( @"%@", [notification object]]];
	NSLog( @"%@", [notification userInfo]]];
}*/

- (void) setupConnectionMonitoring {
	NSString* mailErrorDesc = nil;
	NSPropertyListFormat mailFormat;
	
	NSString* path = [@"~/Library/Preferences/com.apple.mail.plist" stringByExpandingTildeInPath];
	NSString* pathLion = [@"~/Library/Mail/V2/MailData/Accounts.plist" stringByExpandingTildeInPath];
	
	if ( [[NSFileManager defaultManager] fileExistsAtPath:pathLion] ) {
		path = pathLion;
	}
	
	NSData* mailPListXML = [[NSFileManager defaultManager] contentsAtPath:path];
	NSDictionary* mailPList = (NSDictionary*)[NSPropertyListSerialization  propertyListFromData:mailPListXML mutabilityOption:NSPropertyListMutableContainersAndLeaves  format:&mailFormat errorDescription:&mailErrorDesc];
	
	if (not mailPList) {
		NSLog( @"MailWidget : Error reading plist: %@, format: %lu", mailErrorDesc, mailFormat );
		return;
	}
	
	NSArray* mailAccounts = [mailPList objectForKey:@"MailAccounts"];
	NSString* accountName = nil;
	NSString* hostName = nil;
	
	NSMutableArray* hostsToMonitor = [NSMutableArray array];
	
	for ( NSDictionary* eachMailAccount in mailAccounts ) {
		accountName = [eachMailAccount valueForKey:@"AccountName"];
		hostName = [eachMailAccount valueForKey:@"Hostname"];
		
		if ( not accountName or [accountName isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing AccountName" );
			continue;
		}
		
		if ( not hostName or [hostName isEqualToString:@""] ) {
			NSLog( @"MailWidget : missing Hostname" );
			continue;
		}
		
		NSLog( @"MailWidget : AccountName : %@", accountName );
		NSLog( @"MailWidget : Hostname : %@", hostName );
		
		if ( [mActiveAppleMailAccounts containsObject: accountName] ) {
			HostReachability* reachableHost = [[HostReachability alloc] initWithHostName:hostName callbackReceiver:self];
			[hostsToMonitor addObject:reachableHost];
			[reachableHost release];
		}
	}
	
	mReachableHosts = [[NSArray arrayWithArray:hostsToMonitor] retain];
	
	for ( HostReachability* hostMonitor in mReachableHosts ) {
		NSLog( @"MailWidget : Host %@ is inserted", [hostMonitor hostName] );
	}
}

- (void) clearConnectionMonitoring {
	[mReachableHosts release];
    mReachableHosts = nil;
}

- (void) reachabilityChanged {
	BOOL reachable = YES;
	
	for ( HostReachability* hostMonitor in mReachableHosts ) {
		if ( not [hostMonitor hostReachable] ) {
			NSLog( @"MailWidget : Host %@ is not reachable", [hostMonitor hostName] );
			reachable = NO;
		}
	}
	
	if ( reachable ) {
		[self evaluateJS:@"connectivity( true );"];
	} else {
		[self evaluateJS:@"connectivity( false );"];
	}
}

- (void) mailAlreadyRunning {
	NSLog( @"MailWidget : Mail Running" );
	[self evaluateJS:@"mailRunning( true );"];
}

- (void) receiveAppLaunchNote: (NSNotification*) notification {
	NSString* launchedAppBundleID = [[notification userInfo] objectForKey:@"NSApplicationBundleIdentifier"];
	
	if ( [launchedAppBundleID isEqualToString:@"com.apple.mail"] ) {
		NSLog( @"MailWidget : Mail Launched" );
		[self evaluateJS:@"mailRunning( true );"];
	}
}

- (void) receiveAppTerminatedNote: (NSNotification*) notification {
	NSString* launchedAppBundleID = [[notification userInfo] objectForKey:@"NSApplicationBundleIdentifier"];
	
	if ( [launchedAppBundleID isEqualToString:@"com.apple.mail"] ) {
		NSLog( @"MailWidget : Mail Terminated" );
		[self evaluateJS:@"mailRunning( false );"];
	}
}

- (void) receiveSleepNote: (NSNotification*) notification {
	NSLog( @"MailWidget : receiveSleepNote: %@", [notification name]);
	NSLog( @"MailWidget : %@", notification );
}

- (void) receiveWakeNote: (NSNotification*) notification {
	NSLog( @"MailWidget : receiveWakeNote: %@", [notification name]);
	NSLog( @"MailWidget : %@", notification );
}

- (void) evaluateJS: (NSString*) js {
	[mWebScriptObject evaluateWebScript: js];
}

- (void) log: (NSString*) string {
	NSLog( @"MailWidget : %@", string );
}


@end
