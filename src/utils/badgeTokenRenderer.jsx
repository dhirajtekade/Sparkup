import React from "react";
import { Box, Typography } from "@mui/material";

// NEW LOGIC based on your requirements
const getTierFromPoints = (minPoints, maxPoints) => {
  const min = Number(minPoints);
  const max = Number(maxPoints);

  // 1. Gold: If minimum is 5000 or more
  if (min >= 5000) return "gold";

  // 2. Bronze: If maximum is less than 0
  if (max < 0) return "bronze";

  // 3. Silver: Everything else (between 0 and 4999)
  return "silver";
};

// Helper to shorten very long names
const formatBadgeName = (name) => {
  if (!name) return "";
  const upperName = name.toUpperCase();
  if (upperName.length > 12 && !upperName.includes(" ")) {
    return upperName.substring(0, 10) + "..";
  } else if (upperName.length > 15) {
    const parts = upperName.split(" ");
    let shortName = parts[0].substring(0, 3);
    if (parts[1]) shortName += " " + parts[1].substring(0, 3);
    return shortName;
  }
  return upperName;
};

// UPDATED component to accept minPoints
const BadgeToken = ({ name, minPoints, maxPoints, size = 60 }) => {
  // Pass both min and max to the helper function
  const tier = getTierFromPoints(minPoints, maxPoints);

  const tierStyles = {
    gold: {
      background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7)",
      boxShadow:
        "inset 0 0 5px rgba(191, 149, 63, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #B38728",
    },
    silver: {
      background: "linear-gradient(135deg, #E6E6E6, #FFFFFF, #8E9EAB, #F0F0F0)",
      boxShadow:
        "inset 0 0 5px rgba(142, 158, 171, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #8E9EAB",
    },
    // Used for negative points
    bronze: {
      background: "linear-gradient(135deg, #804A00, #B36F28, #804A00, #CD7F32)",
      boxShadow:
        "inset 0 0 5px rgba(128, 74, 0, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #804A00",
    },
  };

  const currentStyle = tierStyles[tier];

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "4px",
        position: "relative",
        ...currentStyle,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: "50%",
          border: "1px dashed rgba(255,255,255,0.3)",
          pointerEvents: "none",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: "bold",
          color: "white",
          textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
          lineHeight: 1.1,
          fontSize: size < 50 ? "0.6rem" : "0.7rem",
        }}
      >
        {formatBadgeName(name)}
      </Typography>
    </Box>
  );
};

export default BadgeToken;
