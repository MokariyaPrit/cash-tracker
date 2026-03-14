import { Box } from "@mui/material";
import bgimg from '../assets/sign.jpg'
// Define the interface with the correct name
interface SignupIllustrationProps {
  width?: string | number;
  height?: string | number;
}

// Use the correct interface name in the component
export default function Signupimg({ width = "100%", height = "auto" }: SignupIllustrationProps) {
  return (
    <Box
      component="img"
      src={bgimg} // Replace with your actual image path
      alt="Signup Illustration"
      sx={{
        width,
        height,
        objectFit: "contain",
        borderRadius:"35px"
      }}
    />
  );
}