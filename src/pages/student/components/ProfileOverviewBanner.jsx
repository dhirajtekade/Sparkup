import {
  Box, Typography, Paper, Grid, Skeleton, LinearProgress, useTheme
} from '@mui/material';
import BadgeToken from '../../../utils/badgeTokenRenderer';

const ProfileOverviewBanner = ({ loading, currentPoints, currentBadge, nextBadge }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: '#f5f5f5' }}>
          <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Circle for Badge */}
                  <Skeleton variant="circular" width={140} height={140} sx={{ mb: 2 }} />
                  {/* Text for Points and Rank */}
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="40%" height={30} />
              </Grid>
              <Grid item xs={12} md={8}>
                  {/* Rectangle for Progress box */}
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
              </Grid>
          </Grid>
      </Paper>
    );
  }

  // Calculate progress bar width for next badge
  let badgeProgress = 0;
  if (currentBadge && nextBadge) {
      const pointsInTier = currentPoints - currentBadge.minPoints;
      const totalTierRange = nextBadge.minPoints - currentBadge.minPoints;
      badgeProgress = (pointsInTier / totalTierRange) * 100;
  } else if (!currentBadge && nextBadge) {
      const range = nextBadge.minPoints - (currentPoints < 0 ? currentPoints : 0);
      badgeProgress = (currentPoints / range) * 100;
     if(badgeProgress < 0) badgeProgress = 0;
  }

  return (
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${theme.palette.success.light} 30%, #c8e6c9 90%)` }}>
        <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                    <BadgeToken name={currentBadge?.name || 'None'} minPoints={currentBadge?.minPoints || 0} maxPoints={currentBadge?.maxPoints || 0} size={140} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.dark">
                    {currentPoints.toLocaleString()} Points
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Current Rank: <b>{currentBadge?.name || 'Not Ranked'}</b>
                </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Next Rank Goal: <b>{nextBadge?.name || 'Max Rank Reached!'}</b>
                    </Typography>
                    {nextBadge ? (
                        <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={Math.min(badgeProgress, 100)} sx={{ height: 15, borderRadius: 5, bgcolor: theme.palette.success.light, '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">{Math.round(badgeProgress)}%</Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" align="right">
                            {nextBadge.minPoints - currentPoints} more points needed
                        </Typography>
                        </>
                    ) : (
                         <Typography variant="body1" color="success.main">Congratulations! You have reached the highest available rank.</Typography>
                    )}
                </Box>
            </Grid>
        </Grid>
      </Paper>
  );
};

export default ProfileOverviewBanner;