import { Box } from "@mui/material";
import bgimg from '../assets/login.jpg'
// Define the interface with the correct name
interface SignupIllustrationProps {
  width?: string | number;
  height?: string | number;
}

// Use the correct interface name in the component
export default function Loginimg({ width = "100%", height = "auto" }: SignupIllustrationProps) {
  return (
    <Box
      component="img"
      src={bgimg} // Replace with your actual image path
      alt="Login Illustration"
      sx={{
        width,
        height,
        objectFit: "contain",
        borderRadius:"35px"
      }}
    />
  );
}