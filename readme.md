# PADP API

The API component to PADP.
Provides location data and back end services for the front end.

## Local Development

Local Development is relatively straightforward to configure.

You will need to copy the `.env.example` file to `.env`. This will
provide configuration properties such as API keys and port. You can
configure the PORT as whatever you prefer, but ensure whatever instance
of PADP pointing towards this API has the correct port configured.

You will then need to provide a Google Maps API key. This can be found
in Google's cloud console.