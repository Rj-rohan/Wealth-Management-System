"use client";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import ToastContainer from "@/components/ui/ToastContainer";

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <NotificationProvider>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </NotificationProvider>
    </MotionConfig>
  );
}
