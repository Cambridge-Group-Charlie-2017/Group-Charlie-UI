**Group-Charlie-UI**
Auto Archive v1.0

The UI module contains all the components necessary for interfacing with the Group-Charlie module and providing an interface to the user in their default browser.
This will be hosted locally on the user's machine (as opposed to on a server), and as such requires the user to perform some additional setup steps outlined below.

The following is a list of the main features provided to the user by the UI:
- The ability to view emails in all folders stored on their IMAP server, as well as in virtual folders resulting from clustering of the inbox
- Ability to send and receive emails
- The ability to select multiple root directories that the document scanner will analyse when looking for smart attachment suggestions
- A graphical view of how the emails were clustered
- A recluster button that triggers a reevaluation of the clusters


Instructions for running:
1. Download and install npm (bundled with node): https://nodejs.org/en/download/
2. Navigate to the Group-Charlie-UI module (using command prompt / shell) and run 'npm install'
3. Run the Group-Charlie module using the entry point class file uk.ac.cam.cl.charlie.ui.WebUIServer. If this is the first time running that module, refer to the
Group-Charlie README.
4. Then run 'npm start'. This should open the UI in your browser. If you have problems, it may be the port number. 
Changing the port number in package.json might fix it. Do this and retry 'npm start'
5. The UI should now be running.
