# Group-Charlie-UI

## Auto Archive v1.0

The UI module contains all the components necessary for interfacing with the Group-Charlie module and providing an interface to the user in their default browser.
This will be hosted locally on the user's machine (as opposed to on a server), and as such requires the user to perform some additional setup steps outlined below.

The following is a list of the main features provided to the user by the UI:
- The ability to view emails in all folders stored on their IMAP server, as well as in virtual folders resulting from clustering of the inbox
- Ability to send and receive emails
- The ability to select multiple root directories that the document scanner will analyse when looking for smart attachment suggestions
- A graphical view of how the emails were clustered
- A recluster button that triggers a reevaluation of the clusters


Instructions after cloning:
1. Download and install npm (bundled with node): https://nodejs.org/en/download/
2. Navigate to the Group-Charlie-UI module (using command prompt / shell) and run 'npm install'
3. Execute command `patch -p1 < tinymce.patch`. This fixes a minor bug in TinyMCE. Ignore this step if the patch cannot be applied, which might indicate that the bug is fixed upstream.

Intruction for running:
1. Run the Group-Charlie module if it's not up yet. If this is the first time running that module, refer to the Group-Charlie README.
2. Run `npm start` if the web server is not up yet. For ease of development, the port number is set to 80. If the number is not usable, it can be changed in package.json.
3. If you run `npm start` for the first time, UI should be opened automatically. Otherwise, navigate to `localhost` or `localhost:port` if port number is changed.

