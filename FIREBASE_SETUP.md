Firebase Backend Setup Guide for SparkUp
This document outlines the steps required to configure your own Firebase project to act as the backend for the SparkUp application.

Because SparkUp relies heavily on role-based access control (Admin, Teacher, Student), a specific Firebase configuration and database structure are required for the application to function correctly.

Prerequisites
A Google Account.

The SparkUp application source code cloned to your local machine.

Node.js and npm installed.

# Phase 1: Firebase Console Setup
Step 1: Create a New Project
Go to the Firebase Console.

Click "Add project" (or "Create a project").

Enter a name for your project (e.g., my-sparkup-app).

(Optional) You can disable Google Analytics for this project as it is not required for core functionality.

Click "Create project". Wait for provision to complete and click "Continue".

Step 2: Enable Authentication
The app uses Email/Password authentication.

In the left sidebar menu under Build, click Authentication.

Click "Get started".

Under the Sign-in method tab, click "Email/Password".

Ensure the top toggle "Enable" is switched ON. (Leave "Email link (passwordless sign-in)" OFF).

Click "Save".

Step 3: Create the Firestore Database
This is where all user data, tasks, and progress will be stored.

In the left sidebar menu under Build, click Firestore Database.

Click "Create database".

Secure rules for Cloud Firestore: Select "Start in production mode". We will add our specific rules in the next step.

Click "Next".

Cloud Firestore location: Select a region geographically close to you or your intended users.

Click "Enable".

Step 4: Apply Security Rules (CRITICAL)
The application will not work without these exact rules. They define who is an 'admin', 'teacher', or 'student' and what data they can access.

In the Firestore section, click the "Rules" tab at the top.

Delete the default rules currently in the editor.

Paste the following ruleset completely into the editor:

Code snippet

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Helper function to check user role
function hasRole(role) {
return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}

    // --- USERS COLLECTION ---
    match /users/{userId} {
       // Admins can read/write everyone
       allow read, write: if hasRole('admin');

       // Teachers can read/write students they created
       allow read, write: if hasRole('teacher') && resource.data.role == 'student' && resource.data.createdByTeacherId == request.auth.uid;
       // Teachers can read their own profile
       allow read: if request.auth.uid == userId;

       // Students can read their own profile
       allow read: if hasRole('student') && request.auth.uid == userId;

       // Allow creation of new users if authenticated (needed for teacher creating students)
       allow create: if request.auth != null;

       // --- COMPLETIONS SUBCOLLECTION (Nested under users) ---
       match /completions/{completionId} {
          // Teachers can read completions of their students
          allow read: if hasRole('teacher') && get(/databases/$(database)/documents/users/$(userId)).data.createdByTeacherId == request.auth.uid;
          // Students can read/write their own completions
          allow read, write: if request.auth.uid == userId;
       }
    }

    // --- TASK TEMPLATES COLLECTION ---
    match /task_templates/{taskId} {
       // Admins can read all
       allow read: if hasRole('admin');
       // Teachers manage their own tasks
       allow read, write: if hasRole('teacher') && resource.data.createdByTeacherId == request.auth.uid;
       allow create: if hasRole('teacher') && request.resource.data.createdByTeacherId == request.auth.uid;
       // Students read tasks assigned by their teacher
       allow read: if hasRole('student') && resource.data.createdByTeacherId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.createdByTeacherId;
    }

     // --- BADGES COLLECTION ---
    match /badges/{badgeId} {
       // Admins can read all
       allow read: if hasRole('admin');
       // Teachers manage their own badges
       allow read, write: if hasRole('teacher') && resource.data.createdByTeacherId == request.auth.uid;
       allow create: if hasRole('teacher') && request.resource.data.createdByTeacherId == request.auth.uid;
       // Students read badges created by their teacher
       allow read: if hasRole('student') && resource.data.createdByTeacherId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.createdByTeacherId;
    }

     // --- GOALS COLLECTION ---
    match /goals/{goalId} {
       // Admins can read all
       allow read: if hasRole('admin');
       // Teachers manage their own goals
       allow read, write: if hasRole('teacher') && resource.data.createdByTeacherId == request.auth.uid;
       allow create: if hasRole('teacher') && request.resource.data.createdByTeacherId == request.auth.uid;
       // Students read goals created by their teacher
       allow read: if hasRole('student') && resource.data.createdByTeacherId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.createdByTeacherId;
    }

    // --- SETTINGS COLLECTION ---
    match /settings/{settingId} {
       // Only admins can manage settings
       allow read, write: if hasRole('admin');
       // Teachers need to read global settings (e.g. "allowDelete")
       allow read: if hasRole('teacher');
    }

}
}
Click "Publish".

# Phase 2: Bootstrapping the First Admin User
You cannot log into the app yet because there are no users with the 'admin' role. You must create the first one manually in the Firebase Console.

Step 1: Create the Authentication Account
Go back to Authentication -> Users tab in the console.

Click "Add user".

Enter an email and password for your initial admin account (e.g., admin@myorg.com).

Click "Add user".

IMPORTANT: Once created, find that user in the list and copy their User UID to your clipboard.

Step 2: Create the Firestore User Document
Go back to Firestore Database -> Data tab.

Click "Start collection".

Collection ID: type users and click "Next".

Document ID: Paste the User UID you copied in the previous step.

Add the following fields:

Field: email, Type: string, Value: (The email you used, e.g., admin@myorg.com)

Field: role, Type: string, Value: admin (Crucial Step)

Click "Save".

You now have a functional admin account that can log into the app.

Phase 3: Connecting the Application
Now you need to tell your local React code how to talk to this new Firebase project.

Step 1: Get Firebase Config Keys
In the Firebase Console, click the Project Overview gear icon (settings) near the top left and select Project settings.

Scroll down to the Your apps section.

Click the Web (</>) icon to register your web app.

Give it a nickname (e.g., "SparkUp Web") and click "Register app".

Select the "Use npm" radio button. You will see a code block containing a firebaseConfig object. Keep this screen open.

Step 2: Configure Environment Variables
In your local project root directory, create a new file named .env.local (if it doesn't exist).

Warning: Do not commit .env.local to version control (git). It contains secret keys. Ensure it is listed in your .gitignore file.

Copy the values from the Firebase console config object into this file using the VITE prefix format shown below:

Code snippet

# .env.local

VITE_FIREBASE_API_KEY=your_api_key_from_console
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id



Verification
Start your local development server (npm run dev).

Navigate to the login page.

Log in using the admin email and password you created in Phase 2.

If successful, you should be redirected to the Admin Dashboard.

You can now use the Admin account to create Teacher accounts, and use those Teacher accounts to create Students.
