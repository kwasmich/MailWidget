//
//  HostReachability.m
//  MailWidgetPlugin
//
//  Created by Michael Kwasnicki on 27.05.10.
//  Copyright 2010 kwasi-ich. All rights reserved.
//

#import "HostReachability.h"

#ifndef DEBUG
#define NSLog(...)
#endif

static void CleanupTarget(SCNetworkReachabilityRef thisTarget)
// Disposes of thisTarget.
{
    assert(thisTarget != NULL);
    
    // Ignore the result from SCNetworkReachabilityUnscheduleFromRunLoop. 
    // It basically tells us whether thisTarget was successfully removed 
    // from the runloop.  It will be false if we never added thisTarget 
    // to the runloop, which is a definite possibility under error 
    // conditions.
    
    (void) SCNetworkReachabilityUnscheduleFromRunLoop(
													  thisTarget,
													  CFRunLoopGetCurrent(),
													  kCFRunLoopDefaultMode
													  );
    CFRelease(thisTarget);
}

static void MyReachabilityCallback(
								   SCNetworkReachabilityRef	target,
								   SCNetworkConnectionFlags	flags,
								   void* info
								   )
// This routine is a System Configuration framework callback that 
// indicates that the reachability of a given host has changed.  
// It's call from the runloop.  target is the host whose reachability 
// has changed, the flags indicate the new reachability status, and 
// info is the context parameter that we passed in when we registered 
// the callback.  In this case, info is a pointer to the host name.
// 
// Our response to this notification is simply to print a line 
// recording the transition.
{
    assert(target != NULL);
    assert(info   != NULL);
    HostReachability* self = info;
	
	if ( ( flags & kSCNetworkFlagsReachable ) && !( flags & kSCNetworkFlagsConnectionRequired ) ) {
		[self hostReachable:YES];
	} else {
		[self hostReachable:NO];
	}
}

@implementation HostReachability

- (id) init {
	return [self initWithHostName:nil callbackReceiver:nil];
}	

- (id) initWithHostName: (NSString*) hostName_ callbackReceiver: (NSObject<HostReachabilityDelegate>*) callbackReceiver_ {
	self = [super init];
	
	if ( self ) {
		hostReachable = NO;
		[hostName_ retain];
		hostName = hostName_;
		[callbackReceiver_ retain];
		callbackReceiver = callbackReceiver_;
		[self setupConnectionMonitoring];
	}
	
	return self;
}

- (void) dealloc {
	[self clearConnectionMonitoring];
	[hostName release];
	[callbackReceiver release];
	[super dealloc];
}

- (NSString*) description {
	return [NSString stringWithFormat:@"Checking reachability for host : %@", hostName];
}

- (BOOL) hostReachable {
	return hostReachable;
}

- (NSString*) hostName {
	return hostName;
}

- (void) setHostName: (NSString*) hostName_ {
	[self clearConnectionMonitoring];
	[hostName_ retain];
	[hostName release];
	hostName = hostName_;
	[self setupConnectionMonitoring];
}

- (NSObject<HostReachabilityDelegate>*) callbackReceiver {
	return callbackReceiver;
}

- (void) setCallbackReceiver: (NSObject<HostReachabilityDelegate>*) receiver_ {
	[receiver_ retain];
	[callbackReceiver release];
	callbackReceiver = receiver_;
}


- (void) setupConnectionMonitoring {
	int err = 0;
	Boolean okay = true;
	SCNetworkReachabilityRef        thisTarget;
	SCNetworkReachabilityContext    thisContext;
	
	thisContext.version         = 0;
	thisContext.info            = self;
	thisContext.retain          = NULL;
	thisContext.release         = NULL;
	thisContext.copyDescription = NULL;
	
	// Create the target with the name taken from the command 
	// line arguments.
	
	thisTarget = SCNetworkReachabilityCreateWithName(
													 NULL, 
													 [hostName UTF8String]
													 );
	if (thisTarget == NULL) {
		err = SCError();
	}
	
	// Set our callback and install on the runloop.
	
	if (err == 0) {
		okay = SCNetworkReachabilitySetCallback(
												thisTarget, 
												MyReachabilityCallback,
												&thisContext
												);
		if ( ! okay ) {
			err = SCError();
		}
	}
	if (err == 0) {
		okay = SCNetworkReachabilityScheduleWithRunLoop(
														thisTarget, 
														CFRunLoopGetCurrent(), 
														kCFRunLoopDefaultMode
														);
		if ( ! okay ) {
			err = SCError();
		}
	}
	
	if (err == 0) {
		SCNetworkConnectionFlags flags;
		
		okay = SCNetworkReachabilityGetFlags(thisTarget, &flags);
		if ( okay ) {
			
		} else {
			err = SCError();
		}
	}
	
	// Record the reference in the targets array, or clean it 
	// up and bail.
	
	if (err == 0) {
		target = thisTarget;
	} else {
		if (thisTarget != NULL) {
			CleanupTarget(thisTarget);
		}
	}
}

- (void) clearConnectionMonitoring {
	assert(target != NULL);
	CleanupTarget(target);
}

- (void) hostReachable: (BOOL) rachable_ {
	if ( rachable_ ) {
		hostReachable = YES;
		NSLog( @"HostReachability : %@ reachable\n", hostName );
		[callbackReceiver reachabilityChangedForHost:hostName to:YES];
	} else {
		hostReachable = NO;
		NSLog( @"HostReachability : %@ NOT reachable\n", hostName );
		[callbackReceiver reachabilityChangedForHost:hostName to:NO];
	}
}

@end
