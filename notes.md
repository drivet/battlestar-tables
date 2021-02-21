## Game Request
* notion of a game request
* Screen where you can enter the number players, how many AI, etc.
* has create date, status, status of invites

## Invites
* notion of an invite
* sender, recipient
* date of create
* status (accepted, pending, rejected)

## User
* User can see their own game requests
* User can see their invites

## Search Patterns
* Game requests by host (populate user's front screen)
** Implcitly also has invites sent out
* Invites by recipient (populate user's front screen)
* Invites by gamerequest (populate the game request page)
* Game request by id (link off invite list and game request list)

## Resources/Verbs

* POST /gamerequests/
* POST /gamerequests/<id>/invites
** creates a standalone invite for the game request
* DELETE /invites/<id>
* GET /gamerequests/<id>
** fetches the game request but also the invites
* GET /gamerequests (user's gamerequests)
* GET /invites (invites for which user is recipient)

