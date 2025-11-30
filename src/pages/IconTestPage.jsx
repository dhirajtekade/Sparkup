import React from 'react';
import { Box, Typography, Paper, Grid, Container } from '@mui/material';
// Importing a few game icons
import { GiTrophyCup, GiMedalSkull, GiCheckedShield, GiDragonHead } from "react-icons/gi";

// A simple helper to wrap icons in a colored box for presentation
const IconWrapper = ({ title, children, bgColor = '#f5f5f5' }) => (
  <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: bgColor, borderRadius: 2 }}>
    {children}
    <Typography variant="subtitle2" sx={{ mt: 1 }}>{title}</Typography>
  </Paper>
);

const IconTestPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        React Icons Color & Style Test
      </Typography>
      <Typography paragraph color="text.secondary">
        By default, icons are monochromatic (like text). Here are ways to make them look like game badges.
      </Typography>

      {/* SECTION 1: The Basics */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>1. Basic Coloring (Props & CSS)</Typography>
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <IconWrapper title="Default (No Color)">
             {/* Inherits text color (usually black/dark grey) */}
             <GiTrophyCup size={50} />
          </IconWrapper>
        </Grid>
        <Grid item xs={6} md={3}>
          <IconWrapper title="Prop: color='red'">
             {/* Easiest way: pass color prop */}
             <GiMedalSkull size={50} color="red" />
          </IconWrapper>
        </Grid>
        <Grid item xs={6} md={3}>
          <IconWrapper title="MUI sx (Primary)">
             {/* Using MUI system colors */}
             <Box sx={{ color: 'primary.main' }}>
                <GiCheckedShield size={50} />
             </Box>
          </IconWrapper>
        </Grid>
        <Grid item xs={6} md={3}>
          <IconWrapper title="MUI sx (Success)">
             <Box sx={{ color: 'success.main' }}>
                <GiDragonHead size={50} />
             </Box>
          </IconWrapper>
        </Grid>
      </Grid>


      {/* SECTION 2: Gamification Badge Styles (SVG Gradients) */}
      <Typography variant="h6" sx={{ mt: 5, mb: 1 }}>2. Metallic Badge Effects (SVG Gradients)</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Since these are SVGs, we can define linear gradients to create "gold", "silver", and "bronze" effects.
      </Typography>
      
      {/* Define the gradients hidden on the page. We reference them by ID. */}
      <svg width={0} height={0}>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#BF953F" offset="0%" />
          <stop stopColor="#FCF6BA" offset="50%" />
          <stop stopColor="#B38728" offset="100%" />
        </linearGradient>
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#E6E6E6" offset="0%" />
          <stop stopColor="#FFFFFF" offset="50%" />
          <stop stopColor="#8E9EAB" offset="100%" />
        </linearGradient>
        <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#804A00" offset="0%" />
          <stop stopColor="#B36F28" offset="50%" />
          <stop stopColor="#804A00" offset="100%" />
        </linearGradient>
      </svg>

      <Grid container spacing={3}>
        <Grid item xs={4}>
          <IconWrapper title="Gold Style" bgColor="#fffbe6">
             {/* Reference the gradient ID in the color prop */}
             <GiTrophyCup size={70} style={{ fill: "url(#goldGradient)" }} />
          </IconWrapper>
        </Grid>
        <Grid item xs={4}>
          <IconWrapper title="Silver Style" bgColor="#f0f5f7">
             <GiMedalSkull size={70} style={{ fill: "url(#silverGradient)" }} />
          </IconWrapper>
        </Grid>
        <Grid item xs={4}>
          <IconWrapper title="Bronze Style" bgColor="#fff0e6">
             <GiCheckedShield size={70} style={{ fill: "url(#bronzeGradient)" }} />
          </IconWrapper>
        </Grid>
      </Grid>
      
      {/* SECTION 3: Colored Backgrounds (Simple & Clean) */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>3. White Icon on Colored Circle (Modern Look)</Typography>
      <Grid container spacing={3}>
         <Grid item xs={4}>
            <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 2 }}>
               {/* White icon on Gold background */}
               <GiTrophyCup size={40} color="white" />
            </Box>
            <Typography align="center" variant="caption">Gold Bg</Typography>
         </Grid>
         <Grid item xs={4}>
            <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#C0C0C0', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 2 }}>
               {/* White icon on Silver background */}
               <GiMedalSkull size={40} color="white" />
            </Box>
            <Typography align="center" variant="caption">Silver Bg</Typography>
         </Grid>
         <Grid item xs={4}>
            <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#CD7F32', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 2 }}>
               {/* White icon on Bronze background */}
               <GiCheckedShield size={40} color="white" />
            </Box>
            <Typography align="center" variant="caption">Bronze Bg</Typography>
         </Grid>
      </Grid>

    </Container>
  );
};

export default IconTestPage;