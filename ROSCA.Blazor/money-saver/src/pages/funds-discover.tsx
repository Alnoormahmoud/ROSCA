import { useEffect } from "react";
import { useLocation } from "wouter";

// Public discovery has been removed. Membership is admin-controlled now.
// This route just redirects to "my funds" for any old bookmarks.
export default function FundsDiscover() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/app/funds");
  }, [setLocation]);
  return null;
}
