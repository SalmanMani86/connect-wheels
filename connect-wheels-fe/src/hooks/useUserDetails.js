import { useState, useEffect } from "react";
import { useGetAllUsersQuery } from "../redux/slices/apiSlice";

/**
 * Hook to get user details by ID
 * Returns user object with firstName, lastName, email, etc.
 */
export const useUserDetails = (userId) => {
  const { data: usersData } = useGetAllUsersQuery();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (!userId || !usersData?.users) {
      setUserDetails(null);
      return;
    }

    const user = usersData.users.find((u) => String(u.id) === String(userId));
    setUserDetails(user || null);
  }, [userId, usersData]);

  return userDetails;
};

/**
 * Hook to get display name for a user
 * Returns formatted name or email or userId
 */
export const useUserDisplayName = (userId) => {
  const userDetails = useUserDetails(userId);

  if (!userDetails) {
    return userId || "Unknown";
  }

  if (userDetails.firstName || userDetails.lastName) {
    return `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim();
  }

  return userDetails.email || userId || "Unknown";
};

/**
 * Hook to get user initials
 * Returns first letters of first and last name
 */
export const useUserInitials = (userId) => {
  const userDetails = useUserDetails(userId);

  if (!userDetails) {
    return (userId || "U")[0].toUpperCase();
  }

  if (userDetails.firstName && userDetails.lastName) {
    return `${userDetails.firstName[0]}${userDetails.lastName[0]}`.toUpperCase();
  }

  if (userDetails.firstName) {
    return userDetails.firstName[0].toUpperCase();
  }

  if (userDetails.email) {
    return userDetails.email[0].toUpperCase();
  }

  return "U";
};

