import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth or tabs based on token — AuthProvider will handle this later
  return <Redirect href="/auth/login" />;
}
