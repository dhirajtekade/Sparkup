import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import GoogleIcon from "@mui/icons-material/Google";
import LinkIcon from "@mui/icons-material/Link"; // New Icon
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";

const LoginPage = () => {
  // Standard login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State for handling account linking
  const [isLinking, setIsLinking] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState("");
  const [pendingCred, setPendingCred] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get context functions
  const { googleSignIn, linkGoogleToEmailAccount, currentUser, userRole } =
    useAuth();

  // Redirect upon successful login
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === "teacher") navigate("/teacher/dashboard");
      else if (userRole === "student") navigate("/student/tracker");
      else if (userRole === "admin") navigate("/admin/teachers");
    }
  }, [currentUser, userRole, navigate]);

  // --- 1. UPDATED GOOGLE LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    try {
      setError("");
      // We don't set global loading here because the popup handles its own state.
      await googleSignIn();
      // Success is handled by the useEffect
    } catch (err) {
      console.error("Google Login Error:", err);

      // CATCH THE SPECIFIC ERROR FOR EXISTING ACCOUNTS
      if (err.code === "auth/account-exists-with-different-credential") {
        // The email is already in use by another provider (e.g. password).
        // We need to ask the user for that password to link accounts.
        const existingEmail = err.customData.email;
        const pendingCredential = err.credential;

        // Switch UI to linking mode
        setLinkingEmail(existingEmail);
        setEmail(existingEmail); // Pre-fill the normal form too just in case
        setPendingCred(pendingCredential);
        setIsLinking(true);
        setError(
          `An account already exists for ${existingEmail}. Please enter your password to verify and link your Google account.`
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        // Do nothing
      } else {
        setError("Failed to log in with Google. Contact support.");
      }
    }
  };

  // --- 2. NEW HANDLER FOR ACCOUNT LINKING SUBMIT ---
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password to link accounts.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      // Call the complex linking function in context
      await linkGoogleToEmailAccount(linkingEmail, password, pendingCred);
      // Success! The onAuthStateChanged will trigger and redirect.
      // We can reset linking state.
      setIsLinking(false);
      setPendingCred(null);
    } catch (err) {
      setLoading(false);
      console.error("Linking Error:", err);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Cannot link account.");
      } else {
        setError("Failed to link accounts. Please try again.");
      }
    }
  };

  // --- STANDARD EMAIL/PASSWORD HANDLER (Preserved) ---
  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      // Standard login attempt
      await signInWithEmailAndPassword(auth, email, password);
      // Success handled by useEffect
    } catch (err) {
      setLoading(false);
      console.error("Login Error:", err);
      // (Simplified error handling for brevity, your previous switch statement was good too)
      setError("Failed to log in. Check email and password.");
    }
  };

  // Choose which submit handler to use based on state
  const currentSubmitHandler = isLinking
    ? handleLinkSubmit
    : handleStandardSubmit;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            color="primary"
            fontWeight="bold"
          >
            SparkUp
          </Typography>

          {/* 3. DYNAMIC HEADER BASED ON STATE */}
          <Typography
            component="h2"
            variant="h6"
            gutterBottom
            color={isLinking ? "secondary.main" : "textSecondary"}
            sx={{ mb: 3, fontWeight: isLinking ? "bold" : "normal" }}
          >
            {isLinking ? "Link Google Account" : "Sign in to continue"}
          </Typography>

          {error && (
            <Alert
              severity={isLinking ? "warning" : "error"}
              sx={{ width: "100%", mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* 4. CONDITIONALLY RENDER GOOGLE BUTTON */}
          {/* Hide Google button if we are in the middle of linking process */}
          {!isLinking && (
            <>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon color="primary" />}
                onClick={handleGoogleLogin}
                disabled={loading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  fontWeight: "bold",
                  borderColor: "#ddd",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "#f4f7fe",
                  },
                }}
              >
                Sign in with Google
              </Button>
              <Divider sx={{ my: 2, width: "100%", color: "text.secondary" }}>
                OR
              </Divider>
            </>
          )}

          <Box
            component="form"
            onSubmit={currentSubmitHandler}
            noValidate
            sx={{ mt: 1, width: "100%" }}
          >
            {/* If linking, Email is read-only. If normal login, it's editable. */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={isLinking ? linkingEmail : email}
              onChange={(e) => !isLinking && setEmail(e.target.value)}
              disabled={loading || isLinking} // Disabled during loading OR linking mode
              variant={isLinking ? "filled" : "outlined"}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus={isLinking} // Autofocus password if entering linking mode
              helperText={
                isLinking
                  ? "Enter your existing password to verify ownership."
                  : ""
              }
            />

            {/* 5. DYNAMIC SUBMIT BUTTON */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              // Change color if linking to highlight action
              color={isLinking ? "secondary" : "primary"}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 30,
                fontWeight: "bold",
              }}
              disabled={loading}
              startIcon={isLinking ? <LinkIcon /> : null}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : // Change text based on state
              isLinking ? (
                "Verify & Link Account"
              ) : (
                "Log In with Password"
              )}
            </Button>

            {/* 6. CANCEL LINKING BUTTON */}
            {isLinking && (
              <Button
                fullWidth
                variant="text"
                color="inherit"
                onClick={() => {
                  setIsLinking(false);
                  setError("");
                  setPassword("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
