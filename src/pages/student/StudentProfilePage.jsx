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

// Import our new divided components
import ProfileOverviewBanner from "./components/ProfileOverviewBanner";
import ProfileProgressGraph from "./components/ProfileProgressGraph";
import ProfileGoalsList from "./components/ProfileGoalsList";

const StudentProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [goals, setGoals] = useState([]);
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      // Small artificial delay to see skeleton loading state (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 800));

      try {
        // 1. Fetch Student & Basic Info
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
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
          let progress = 0;
          if (!isAchieved && gData.targetPoints > 0) {
            progress = (currentTotalPoints / gData.targetPoints) * 100;
          }
          goalList.push({
            id: doc.id,
            ...gData,
            isAchieved,
            progress: Math.min(progress, 100),
          });
        });
        setGoals(goalList);

        // 4. Fetch Graph Data
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
        const dailyGainsMap = new Map();
        graphSnapshot.forEach((doc) => {
          const data = doc.data();
          dailyGainsMap.set(
            data.dateCompleted,
            (dailyGainsMap.get(data.dateCompleted) || 0) +
              (data.pointsEarned || 0)
          );
        });

        let runningTotal = currentTotalPoints;
        const finalChartData = [];
        for (let i = 0; i < 30; i++) {
          const dateObj = today.subtract(i, "day");
          const dateStr = dateObj.format("YYYY-MM-DD");
          finalChartData.unshift({
            date: dateObj.format("MMM D"),
            totalPoints: runningTotal < 0 ? 0 : runningTotal,
          });
          runningTotal -= dailyGainsMap.get(dateStr) || 0;
        }
        setGraphData(finalChartData);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // If data load failed entirely
  if (!loading && !studentData)
    return <Typography>Profile not found.</Typography>;

  const currentPoints = studentData?.totalPoints || 0;

  return (
    <Box maxWidth="lg" sx={{ mx: "auto" }}>
      {/* REPORT 1: Overview Banner */}
      <ProfileOverviewBanner
        loading={loading}
        currentPoints={currentPoints}
        currentBadge={currentBadge}
        nextBadge={nextBadge}
      />

      {/* REPORT 2: Progress Graph */}
      <ProfileProgressGraph loading={loading} graphData={graphData} />

      {/* REPORT 3: Goals List */}
      <ProfileGoalsList 
          loading={loading}
          goals={goals}
          // --- ADD THIS NEW PROP ---
          currentPoints={currentPoints}
          // -------------------------
      />
    </Box>
  );
};

export default StudentProfilePage;
