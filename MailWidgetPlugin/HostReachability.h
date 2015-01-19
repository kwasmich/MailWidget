//
//  HostReachability.h
//  MailWidgetPlugin
//
//  Created by Michael Kwasnicki on 27.05.10.
//  Copyright 2010 kwasi-ich. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#include <SystemConfiguration/SystemConfiguration.h>

@protocol HostReachabilityDelegate;

@interface HostReachability : NSObject {
	BOOL hostReachable;
	NSString* hostName;
	SCNetworkReachabilityRef target;
	NSObject<HostReachabilityDelegate>* callbackReceiver;
}

- (id) initWithHostName: (NSString*) hostName_ callbackReceiver: (NSObject<HostReachabilityDelegate>*) callbackReceiver_;

- (BOOL) hostReachable;
- (NSString*) hostName;
- (void) setHostName: (NSString*) hostName_;
- (NSObject<HostReachabilityDelegate>*) callbackReceiver;
- (void) setCallbackReceiver: (NSObject<HostReachabilityDelegate>*) receiver_;

- (void) setupConnectionMonitoring;
- (void) clearConnectionMonitoring;
- (void) hostReachable: (BOOL) rachable_;
@end


@protocol HostReachabilityDelegate
- (void) reachabilityChangedForHost: (NSString*) hostName_ to: (BOOL) reachable_;
@end
