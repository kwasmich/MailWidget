//
//  InterfaceClass.h
//  MailWidgetPlugin
//
//  Created by Michael Kwasnicki on 2009-09-15.
//  Copyright 2009 Kwasi. All rights reserved.
//

#import "HostReachability.h"
#import "Mail.h"

#import <Cocoa/Cocoa.h>
//#include <CoreFoundation/CoreFoundation.h>
#import <SystemConfiguration/SystemConfiguration.h>


@interface InterfaceClass : NSObject <NSUserNotificationCenterDelegate, GrowlApplicationBridgeDelegate, HostReachabilityDelegate> {
	@private
	MailApplication* mAppleMail;
	NSArray* mActiveAppleMailAccounts;
	WebScriptObject* mWebScriptObject;
	NSArray* mReachableHosts;
    NSData* mGrowlIcon;
}

- (id) initWithWebView: (WebView*) webview;
- (void) windowScriptObjectAvailable: (WebScriptObject*) windowScriptObject;

+ (NSString*) webScriptNameForSelector: (SEL) aSelector;
+ (BOOL) isSelectorExcludedFromWebScript:(SEL) aSelector;
+ (NSString*) webScriptNameForKey: (const char*) var;
+ (BOOL) isKeyExcludedFromWebScript: (const char*) var;
//- (id) invokeUndefinedMethodFromWebScript:(NSString *)name withArguments:(NSArray *)arguments;
//- (id) invokeDefaultMethodWithArguments:(NSArray *)arguments;
//- (void) finalizeForWebScript;

- (NSDictionary*) registrationDictionaryForGrowl;
- (NSString*) applicationNameForGrowl;
- (NSImage*) applicationIconForGrowl;
//- (NSData*) applicationIconDataForGrowl;
//- (void) growlIsReady;
- (void) growlNotificationWasClicked: (id) clickContext;
//- (void) growlNotificationTimedOut: (id) clickContext;


- (void) userNotificationCenter:(NSUserNotificationCenter*)center didActivateNotification:(NSUserNotification*)notification;
- (BOOL) userNotificationCenter:(NSUserNotificationCenter*)center shouldPresentNotification:(NSUserNotification*)notification;


- (void) dealloc;

//- (void) network;
//- (NSString*) myFirstFunction;
//- (NSArray*) mySecondFunction: (int) number;
- (void) setActiveAccounts: (WebScriptObject*) jsArray;
- (void) playAudioFile: (NSString*) path withVolume: (float) volume;
- (NSArray*) getAppleMailAccounts;
- (void) growlWithTitle: (NSString*) title description: (NSString*) description;
- (NSArray*) getAppleMailUnreadCount;
- (void) appleMailLaunchAndCheck;
- (void) appleMailCheck;
- (void) setPasswordForAccount: (NSString*) account to: (NSString*) password;
- (NSString*) getPasswordForAccount: (NSString*) account;
//- (void) deletePasswordForAccount: (NSString*) account;

- (void) setupConnectionMonitoring;
- (void) clearConnectionMonitoring;
- (void) reachabilityChanged;

- (void) mailAlreadyRunning;
- (void) receiveAppLaunchNote: (NSNotification*) notification;
- (void) receiveAppTerminatedNote: (NSNotification*) notification;
- (void) receiveSleepNote: (NSNotification*) notification;
- (void) receiveWakeNote: (NSNotification*) notification;

- (void) evaluateJS: (NSString*) js;

- (void) log: (NSString*) string;

@end
