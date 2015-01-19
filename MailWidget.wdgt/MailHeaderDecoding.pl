#!/usr/bin/perl

# Decodes a given email header and encodes the result into UTF-8 charset.
# Note to quote whitespaces!

# @author Markus Kwaśnicki, Michael Kwaśnicki
# @date 2009-10-05

use strict;
use utf8;
use Encode(); 

my $header = $ARGV[0];

if ( defined( $header ) ) 
{
	# Return value owns UTF-8 flag only if valid mime header including an enconding is present.
	# The resulting string is decoded according to the given encoding from header.
	# ( Not necessarily UTF-8 )
	$header = Encode::decode( 'MIME-Header', $header );

	# According to the UTF-8 flag.
	utf8::encode( $header ) if utf8::is_utf8( $header );

	print $header;
}

__END__
