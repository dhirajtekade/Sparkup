import React from "react";
import { Box, Typography } from "@mui/material";

const getTierFromPoints = (minPoints, maxPoints) => {
  // Use || 0 to handle missing data safely
  const min = Number(minPoints || 0);
  const max = Number(maxPoints || 0);

  // 1. Bronze (Brown)
  if (max < 0) return "bronze";

  // 2. Gold
  if (min >= 4000) return "gold";

  // 3. Silver
  return "silver";
};

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

// === MAIN COMPONENT ===
const BadgeToken = ({ name, minPoints, maxPoints, size = 60 }) => {
  const tier = getTierFromPoints(minPoints, maxPoints);

  const tierStyles = {
    gold: {
      background:
        "linear-gradient(135deg, #DBA514 0%, #FEE9A0 50%, #DBA514 100%)",
      boxShadow:
        "inset 0 0 5px rgba(191, 149, 63, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #B38728",
    },
    silver: {
      background:
        "linear-gradient(135deg, #9FA4A8 0%, #FFFFFF 50%, #9FA4A8 100%)",
      boxShadow:
        "inset 0 0 5px rgba(142, 158, 171, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #8E9EAB",
    },
    bronze: {
      background:
        "linear-gradient(135deg, #8C5E35 0%, #C4966E 50%, #8C5E35 100%)",
      boxShadow:
        "inset 0 0 5px rgba(128, 74, 0, 0.7), 2px 2px 5px rgba(0,0,0,0.3)",
      border: "2px solid #6E4221",
    },
  };

  // Fallback to silver just in case tier is somehow undefined
  const currentStyle = tierStyles[tier] || tierStyles.silver;

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
          top: 3,
          left: 3,
          right: 3,
          bottom: 3,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.4)",
          pointerEvents: "none",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: "900",
          color: "white",
          textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
          lineHeight: 1,
          fontSize: size < 50 ? "0.6rem" : "0.75rem",
          zIndex: 2,
        }}
      >
        {formatBadgeName(name)}
      </Typography>
    </Box>
  );
};

export default BadgeToken;
