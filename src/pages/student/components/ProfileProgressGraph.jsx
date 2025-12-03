import {
  Box, Typography, Paper, Skeleton, useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const ProfileProgressGraph = ({ loading, graphData }) => {
  const theme = useTheme();

  if (loading) {
      return <Skeleton variant="rectangular" height={250} sx={{ mb: 4, borderRadius: 3 }} />;
  }

  return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'white' }}>
         <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'success.dark' }}>
             <TrendingUpIcon sx={{ mr: 1 }} /> 30-Day Progress Trend
         </Typography>
         <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
                <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} interval={graphData.length > 15 ? 2 : 0} />
                    <YAxis tick={{fontSize: 12}} width={40} />
                    <ChartTooltip 
                        contentStyle={{ borderRadius: 8, borderColor: theme.palette.success.light }}
                        formatter={(value) => [`${value} pts`, "Total Points"]}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="totalPoints" 
                        stroke={theme.palette.success.main} 
                        fillOpacity={1} 
                        fill="url(#colorPoints)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
         </Box>
      </Paper>
  );
};

export default ProfileProgressGraph;