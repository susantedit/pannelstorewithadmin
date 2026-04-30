import { Navigate } from 'react-router-dom';

// With Firebase Google-only auth, there's no separate register page.
// New users are created automatically on first Google sign-in.
export default function RegisterPage() {
  return <Navigate to="/login" replace />;
}
