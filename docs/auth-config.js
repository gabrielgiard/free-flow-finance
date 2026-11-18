/* FreeFlow Finance — sign-in settings.

   Accounts are optional. While the line at the bottom says null, the site
   shows no sign-in button at all and works exactly as it always has (the
   watchlist and saved cases still work, saved on each device).

   To switch accounts on, follow SETUP-login.txt. Near the end, Firebase
   shows you a block of text that starts with

       const firebaseConfig = {

   and ends with

       };

   Select the line at the bottom of this file (const firebaseConfig = null;)
   and paste that whole block over it. Keep these comments. Then save
   ("Commit changes" on GitHub).

   These values are not secret: every visitor's browser needs them to reach
   the sign-in service. What keeps each account private is the database
   rules in firestore.rules. */

const firebaseConfig = null;
