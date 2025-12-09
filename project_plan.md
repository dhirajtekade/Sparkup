Part 1: The Development Plan (Phased Approach)
Don't try to build everything at once. Follow this phased approach.
Phase 1: Foundation & Authentication
1.	Setup React project (Vite is recommended over CRA).
2.	Setup Firebase project (enable Firestore, Auth, Storage).
3.	Implement basic routing (React Router).
4.	Auth Implementation:
o	Create a Login page.
o	Temporary Hack: Manually create the two teacher accounts (ymht, Niruma) in the Firebase Auth console.
o	Create a generic "Protected Route" component that checks if a user is logged in and what their role is before letting them view a page.
# #####################################################

Phase 2: Teacher CRUD Operations (Data Entry)
Focus only on the teacher's ability to input data.
1.	Create the Teacher Layout/Sidebar.
2.	Badges & Goals CRUD: Build forms to add name, description, points, and upload an image to Firebase Storage, saving the resulting download URL in Firestore.
3.	Tasks CRUD: Build forms for task details (start/end dates are crucial here).
4.	Student Creation: A teacher form that takes an email/password/name, creates a user in Firebase Auth, and then creates the corresponding student document in Firestore.
# #####################################################

Phase 3: The Student Experience (The Core Feature)
This is the most complex UI phase.
1.	The Daily Tracker Grid:
o	Build the logic to generate an array of dates from the 1st of the month to today.
o	Fetch assigned tasks.
o	Fetch existing completion data for the current month.
o	Render the table matrix (Tasks x Dates) with checkboxes.
o	Implement the onChange handler for the checkbox: It should add or remove a "completion document" in Firestore and update the student's total points atomically.
2.	Profile & Badge: Fetch and display student details and their current active badge image.
# #####################################################

Phase 4: Goals & Analytics
1.	Student Goal Progress: Calculate total points vs. the points needed for the next goal and visualize it (e.g., a progress bar).
2.	Analytics Dashboard: Create complex queries to aggregate data for reports (e.g., "calculate sum of points earned in November by Student X").


# ##############################################################

We are moving into Phase 6: UI Polish & Reporting.

Here is the roadmap based on your requests:

Step 36: Student Journey Loader UI (Skeleton Screens) - Instead of a boring spinning circle, we will show gray placeholder shapes that match the final layout. This makes the app feel faster.

Step 37: Daily Tracker UI Improvements - Making the big grid easier to read and navigate.

Step 38: Student Score Graph UI - Adding a visual chart to the student profile showing their points growth over time.

Step 39: Teacher Reports - Creating summary views for the teacher (e.g., "Who hasn't completed tasks today?").
________________________________________
Part 2: Proposed Page Structure (Sitemap)
Public
•	/login
Teacher Routes (Protected: Role = 'teacher' or 'admin')
•	/teacher/dashboard (Quick overview)
•	/teacher/students (List of students, button to "Add Student")
•	/teacher/tasks (List of tasks CRUD)
•	/teacher/tasks/new (Add task form)
•	/teacher/badges (List of badges CRUD)
•	/teacher/goals (List of goals CRUD)
•	/teacher/analytics (Performance reports)
Student Routes (Protected: Role = 'student')
•	/student/tracker (The main daily checklist table - Landing page after login)
•	/student/my-goals (Progress towards goals)
•	/student/profile (View profile, current badge, total score)
________________________________________
Part 3: Firestore Database Structure & Mapping
In NoSQL, we design for how we read data, not just how different entities relate.
Key Concept: We need to separate "Task Templates" (what the teacher creates) from "Task Completions" (what the student does on a specific date).
1. Top-Level Collections
users (Collection) Stores profile data and roles. The document ID should match the Firebase Auth UID.
JSON
// Document ID: "firebaseAuthUid123"
{
  "email": "student@example.com",
  "displayName": "John Doe",
  "role": "student", // or 'teacher', 'admin'
  "totalPoints": 150, // Denormalized for quick access
  "currentBadgeId": "badgeId_xyz", // Reference to a badge document
  "createdAt": "Timestamp"
}
task_templates (Collection) Created by teachers via CRUD.
JSON
// Document ID: auto-generated
{
  "name": "Daily Meditation",
  "description": "10 minutes of focus",
  "points": 10,
  "startDate": "2023-10-01", // ISO string or Timestamp
  "endDate": "2023-12-31",
  "isActive": true
}
badges (Collection) Created by teachers via CRUD.
JSON
// Document ID: auto-generated
{
  "name": "Consistency Champion",
  "description": "Completed tasks 7 days in a row",
  "imageUrl": "https://firebasestorage.googleapis.com/...",
  "pointsRequired": 100
}
goals (Collection) Created by teachers via CRUD.
JSON
// Document ID: auto-generated
{
  "name": "Level 1 Unlock",
  "description": "Reach 500 points",
  "imageUrl": "https://firebasestorage.googleapis.com/...",
  "targetPoints": 500
}
2. Student Data (Sub-collections)
To keep student data organized and secure, use sub-collections under their user document.
users/{studentUid}/assignments (Sub-collection) Links tasks to students. If all students get all tasks, you might skip this. But usually, tasks are assigned.
JSON
// Document ID: the related taskTemplateId
{
   // useful if you want to override start/end dates per student later
   "assignedAt": Timestamp
}
users/{studentUid}/completions (Sub-collection) - CRITICAL This is how you power the student grid. Every time a checkbox is ticked, a document is created here. Ideally, the Document ID is a combination of date and task ID: YYYYMMDD_taskID to ensure a student can't complete the same task twice on the same day.
JSON
// Document ID: "20231027_taskTemplateIdXYZ"
{
  "taskTemplateId": "taskTemplateIdXYZ",
  "taskName": "Daily Meditation", // Denormalized for easier reporting later
  "dateCompleted": "2023-10-27", // String format is excellent for querying date ranges
  "pointsEarned": 10,
  "timestamp": Timestamp
}
Mapping the Student Grid Page (How it works)
When the student lands on /student/tracker:
1.	Calculate Dates: JS determines current month dates (e.g., Oct 1st to Oct 27th).
2.	Fetch Tasks: Query task_templates where isActive is true and today's date falls between startDate and endDate.
3.	Fetch Completions: Query the users/{studentUid}/completions sub-collection where dateCompleted >= "2023-10-01" AND dateCompleted <= "2023-10-27".
4.	Merge on Frontend:
o	Create a Javascript data structure (like a matrix or hashmap).
o	Iterate through the dates (columns).
o	Iterate through the tasks (rows).
o	Check if a completion document exists for that specific Task ID + Date combination. If yes, check the box.
Final Tip for the "Analytics Dashboard"
Firestore is not great at "aggregation queries" (like "sum of all points for all students").
For the Analytics page, you will likely need to:
1.	Perform multiple queries on the client side and calculate totals in Javascript (okay for small datasets).
2.	OR maintain "counters" using Firebase Cloud Functions. E.g., Every time a student completes a task, a Cloud Function runs in the background and increments a monthlyTotalScore_2023_10 field on that student's user document. This makes reading the analytics dashboard very fast later.



#########################
-sort student based on points (column sort functionality) - done
-challenge which comes only once. or task which comes only once. kind of bonus task. once done does not appear again. - done

- 21 days challenge task. - done

- Google Login? - done

- Class Health (Analytics): High impact for teachers, medium effort. - done

- PWA / Dark Mode: High impact on UX, low/medium effort. - done

- Leaderboard: Medium impact, medium effort. - done

- The Point Shop: Massive impact on engagement, but highest effort (a significant mini-project on its own).

- error on login page landing directly =pending

- Progress Trend to have another dropdown with weekly, monthly, quarterly, yearly

- daily quotes

- student forum. student of teacher can post their ideas and others can see, like comment on them.

- student location trace and tracker on map.

- check if task in not active this month then it should not come in the list

- Point Shop, Class Leaderboard, Teacher Analytics, PWA, Dark Mode)

- interesting loader

- In daily tracker show negative point in red

- Task Reminder

- Task info in daily tracker

- select book of your choice, so in page load we get some random quotes from that book.






