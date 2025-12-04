import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

import ProfileOverviewBanner from "./components/ProfileOverviewBanner";
import ProfileProgressGraph from "./components/ProfileProgressGraph";
import ProfileGoalsSection from "./components/ProfileGoalsSection";

const StudentProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [goals, setGoals] = useState([]);

  // State for graph raw data
  const [rawCompletions, setRawCompletions] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [startingTotalPoints, setStartingTotalPoints] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);

      try {
        // 1. Fetch Student & Basic Info directly from Firestore
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        // sData holds the definitive photoUrl saved by the teacher
        setStudentData(sData);
        const currentTotalPoints = sData.totalPoints || 0;
        const teacherId = sData.createdByTeacherId;

        // 2. Fetch & Determine Badges
        const badgesRef = collection(db, "badges");
        const qBadges = query(
          badgesRef,
          where("createdByTeacherId", "==", teacherId),
          orderBy("minPoints", "asc")
        );
        const badgeSnapshot = await getDocs(qBadges);
        const allBadges = [];
        badgeSnapshot.forEach((doc) =>
          allBadges.push({ id: doc.id, ...doc.data() })
        );
        let foundBadge = null;
        let foundNextBadge = null;
        for (let i = 0; i < allBadges.length; i++) {
          const badge = allBadges[i];
          if (
            currentTotalPoints >= badge.minPoints &&
            currentTotalPoints <= badge.maxPoints
          ) {
            foundBadge = badge;
            if (i + 1 < allBadges.length) foundNextBadge = allBadges[i + 1];
            break;
          }
        }
        setCurrentBadge(foundBadge);
        setNextBadge(foundNextBadge);

        // 3. Fetch Goals
        const goalsRef = collection(db, "goals");
        const qGoals = query(
          goalsRef,
          where("createdByTeacherId", "==", teacherId),
          orderBy("targetPoints", "asc")
        );
        const goalSnapshot = await getDocs(qGoals);
        const goalList = [];
        goalSnapshot.forEach((doc) => {
          const gData = doc.data();
          const isAchieved = currentTotalPoints >= gData.targetPoints;
          goalList.push({ id: doc.id, ...gData, isAchieved });
        });
        setGoals(goalList);

        // 4. Fetch Active Tasks for filter dropdown
        const tasksRef = collection(db, "task_templates");
        const qTasks = query(
          tasksRef,
          where("createdByTeacherId", "==", teacherId),
          where("isActive", "==", true)
        );
        const taskSnapshot = await getDocs(qTasks);
        const taskList = [];
        taskSnapshot.forEach((doc) =>
          taskList.push({ id: doc.id, ...doc.data() })
        );
        setActiveTasks(taskList);

        // 5. Fetch Raw Graph Data
        const today = dayjs();
        const thirtyDaysAgoStr = today.subtract(30, "day").format("YYYY-MM-DD");
        const completionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "completions"
        );
        const qCompletionsGraph = query(
          completionsRef,
          where("dateCompleted", ">=", thirtyDaysAgoStr),
          orderBy("dateCompleted", "asc")
        );
        const graphSnapshot = await getDocs(qCompletionsGraph);

        const rawList = [];
        let totalGainedLast30Days = 0;
        graphSnapshot.forEach((doc) => {
          const data = doc.data();
          rawList.push(data);
          totalGainedLast30Days += data.pointsEarned || 0;
        });
        setRawCompletions(rawList);
        setStartingTotalPoints(currentTotalPoints - totalGainedLast30Days);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (!loading && !studentData)
    return <Typography>Profile not found.</Typography>;

  const currentPoints = studentData?.totalPoints || 0;

  return (
    <Box sx={{ width: "100%" }}>
      <ProfileOverviewBanner
        loading={loading}
        currentPoints={currentPoints}
        currentBadge={currentBadge}
        nextBadge={nextBadge}
      />

      <ProfileProgressGraph
        loading={loading}
        rawCompletions={rawCompletions}
        activeTasks={activeTasks}
        startingTotalPoints={startingTotalPoints}
      />

      <ProfileGoalsSection
        loading={loading}
        goals={goals}
        currentPoints={currentPoints}
        // === THE FIX IS HERE ===
        // Use the URL from Firestore data first
        studentPhotoUrl={studentData?.photoUrl || currentUser?.photoURL}
        // =======================
        studentDisplayName={
          studentData?.displayName || currentUser?.email?.split("@")[0]
        }
      />
    </Box>
  );
};

export default StudentProfilePage;
