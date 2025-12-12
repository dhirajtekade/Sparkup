// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import { Box, Typography, Paper } from "@mui/material";
// import LocationOnIcon from "@mui/icons-material/LocationOn";
// import dayjs from "dayjs";

// // Note: Leaflet CSS and icon fixes are already handled in index.html and main.jsx

// const StudentActivityMap = ({ locations = [] }) => {
//   // 1. Handle the case where there is no location data to show
//   if (!locations || locations.length === 0) {
//     return (
//       <Paper
//         elevation={3}
//         sx={{
//           p: 2,
//           mb: 3,
//           borderRadius: 2,
//           height: 400,
//           bgcolor: "#f5f5f5",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           flexDirection: "column",
//         }}
//       >
//         <LocationOnIcon
//           color="disabled"
//           sx={{ fontSize: 60, mb: 2, opacity: 0.5 }}
//         />
//         <Typography variant="h6" color="text.secondary">
//           No Map Data
//         </Typography>
//         <Typography variant="body2" color="text.secondary">
//           This student hasn't completed any tasks with location tracking enabled
//           yet.
//         </Typography>
//       </Paper>
//     );
//   }

//   // 2. Determine initial map center. Use the most recent location (first in array)
//   // Default fallback if something goes wrong with data: [0,0]
//   const latestLocation = locations[0];
//   const defaultCenter =
//     latestLocation.locationLat && latestLocation.locationLng
//       ? [latestLocation.locationLat, latestLocation.locationLng]
//       : [0, 0];

//   const defaultZoom = 13; // Neighbourhood level zoom

//   return (
//     <Box
//       sx={{
//         height: 400,
//         width: "100%",
//         mb: 3,
//         borderRadius: 2,
//         overflow: "hidden",
//         boxShadow: 3,
//         position: "relative",
//         zIndex: 0,
//       }}
//     >
//       <MapContainer
//         center={defaultCenter}
//         zoom={defaultZoom}
//         style={{ height: "100%", width: "100%" }}
//         scrollWheelZoom={false}
//       >
//         {/* Use free OpenStreetMap tiles */}
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />

//         {/* Map through locations and create markers */}
//         {locations.map((item) => (
//           <Marker key={item.id} position={[item.locationLat, item.locationLng]}>
//             <Popup>
//               <Box sx={{ textAlign: "center", p: 0.5 }}>
//                 <Typography
//                   variant="subtitle2"
//                   fontWeight="bold"
//                   sx={{ color: "primary.main" }}
//                 >
//                   {item.taskName}
//                 </Typography>
//                 <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
//                   {item.completedAt
//                     ? dayjs(item.completedAt.toDate()).format("MMM D, h:mm A")
//                     : item.dateCompleted}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   fontWeight="bold"
//                   color="success.main"
//                   sx={{
//                     bgcolor: "#e8f5e9",
//                     display: "inline-block",
//                     px: 1,
//                     borderRadius: 1,
//                   }}
//                 >
//                   +{item.pointsEarned} pts
//                 </Typography>
//               </Box>
//             </Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//       <Typography
//         variant="caption"
//         sx={{
//           position: "absolute",
//           bottom: 5,
//           left: 5,
//           bgcolor: "rgba(255,255,255,0.7)",
//           px: 1,
//           borderRadius: 1,
//           zIndex: 1000,
//           pointerEvents: "none",
//         }}
//       >
//         Showing {locations.length} activity points
//       </Typography>
//     </Box>
//   );
// };

// export default StudentActivityMap;
