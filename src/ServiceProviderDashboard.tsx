/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { Snackbar, Avatar } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "./store/userStore";
import axiosInstance from './axiosInstance';
// import EditProvider from "./EditProvider";
import dayjs from "dayjs";
import ProfileHeader from "./ProfileHeader";
import DashboardBody from "./DashboardBody";

type UserState = {
  value?: {
    role?: string;
    serviceProviderDetails?: any;
  } | null;
};

const ServiceProviderDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.user as UserState);
  const serviceProviderIdd = user?.value?.serviceProviderDetails?.serviceproviderId ?? "Not Available";
  const firstName = user?.value?.serviceProviderDetails?.firstName;
  const lastName = user?.value?.serviceProviderDetails?.lastName;
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); 
  const [activeSwitch, setActiveSwitch] = useState<number | null>(null); 
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");

  // Attendance state
  const initialAttendance: { [key: string]: string } = {};
  for (let day = 1; day <= 28; day++) {
    const dateKey = `2025-01-${day.toString().padStart(2, "0")}`;
    initialAttendance[dateKey] = "Present";
  }
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>(initialAttendance);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch bookings
  useEffect(() => {
    const fetchBookingHistory = async () => {
      try {
        const page = 0;
        const size = 100;
  
        const response = await axiosInstance.get(
          `/api/serviceproviders/get-sp-booking-history?page=${page}&size=${size}`
        );
  
        if (response.data) {
          const currentBookings = response.data.current?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];
          const futureBookings = response.data.future?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];
          const pastBookings = response.data.past?.filter((booking: any) => booking.serviceProviderId === serviceProviderIdd) || [];
  
          const filteredBookings = [...currentBookings, ...futureBookings, ...pastBookings].map((booking: any) => ({
            ...booking,
            engagementId: booking.id,
          }));
  
          setBookings(filteredBookings);
        } else {
          console.error("Error: Invalid API response structure");
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching booking history:", error);
        setBookings([]);
      }
    };
  
    if (serviceProviderIdd) {
      fetchBookingHistory();
    }
  }, [serviceProviderIdd]);

  const handleDateClick = (date: Date) => {
    const dateKey = dayjs(date).format("YYYY-MM-DD");
    if (!initialAttendance[dateKey]) {
      setSelectedDate(date);
    }
  };

  const applyLeave = async (description: string) => {
    if (selectedDate) {
      const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
  
      if (!attendanceData[dateKey]) {
        setAttendanceData((prev) => ({
          ...prev,
          [dateKey]: "Absent",
        }));
      }
  
      const leaveData = {
        serviceproviderId: serviceProviderIdd !== "Not Available" ? serviceProviderIdd : null,
        fromDate: dateKey,
        toDate: dateKey,
        leaveType: "PAID",
         description: description,
      };
      
      try {
        const response = await axiosInstance.post(
          "/api/serviceproviders/add-leave",
          leaveData
        );
        console.log("Leave applied successfully:", response.data);
      } catch (error) {
        console.error("Error applying leave:", error);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSwitchChange = async (value: boolean, index: number) => {
    let updatedStatus = "";

    setBookings(prevBookings =>
      prevBookings.map((booking, i) => {
        if (i === index) {
          updatedStatus =
            booking.taskStatus === "NOT_STARTED" ? "STARTED" :
            booking.taskStatus === "STARTED" ? "COMPLETED" : "STARTED";

          return { ...booking, taskStatus: updatedStatus };
        }
        return booking;
      })
    );

    setActiveSwitch(index);

    const booking = bookings[index];
    if (!booking) {
      setSnackbarMessage("Error: Booking not found!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const updatePayload = {
      ...booking,
      taskStatus: updatedStatus,
    };

    try {
      await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`, 
        updatePayload
      );
      
      setSnackbarMessage(`Task Status updated to ${updatedStatus}`);
      setSnackbarSeverity("success");
    } catch (error) {
      console.error("Error updating task status:", error);
      setSnackbarMessage("Failed to update task status. Please try again.");
      setSnackbarSeverity("error");
    }

    setSnackbarOpen(true);
  };

  const handleCancelBooking = async (index: number) => {
    const booking = bookings[index];
    const updatedStatus = "CANCELLED"; 

    const updatePayload = {
      ...booking,
      taskStatus: updatedStatus,
    };

    try {
      await axiosInstance.put(
        `/api/serviceproviders/update/engagement/${booking.id}`,
        updatePayload
      );

      const updatedBookings = [...bookings];
      updatedBookings[index].taskStatus = updatedStatus;
      setBookings(updatedBookings);

      setSnackbarMessage("Booking successfully cancelled!");
      setSnackbarSeverity("success");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setSnackbarMessage("Failed to cancel booking. Please try again.");
      setSnackbarSeverity("error");
    }

    setSnackbarOpen(true);
  };

  const handleTabChange = (newValue: number) => {
    setSelectedTab(newValue);
  };

  // if (isEditing) {
  //   return <EditProvider goBack={() => setIsEditing(false)} />;
  // }

  // Calculate counts for header badges
  const bookingsCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;

  return (
    <View style={styles.container}>
      {/* Header at the top */}
      <ProfileHeader
        selectedTab={selectedTab}
        handleTabChange={handleTabChange}
        bookingsCount={bookings.length}
        confirmedCount={bookings.filter((b) => b.status === 'Confirmed').length}
        pendingCount={bookings.filter((b) => b.status === 'Pending').length}
      />
      
      {/* Body content below the header */}
      <View style={styles.body}>
        <DashboardBody
          selectedTab={selectedTab}
          bookings={bookings}
          activeSwitch={activeSwitch}
          attendanceData={attendanceData}
          selectedDate={selectedDate}
          handleDateClick={handleDateClick}
          handleSwitchChange={handleSwitchChange}
          handleCancelBooking={handleCancelBooking}
          applyLeave={applyLeave}
          snackbarOpen={snackbarOpen}
          snackbarMessage={snackbarMessage}
          snackbarSeverity={snackbarSeverity}
          handleSnackbarClose={handleSnackbarClose}
        />
      </View>

      <Snackbar
        visible={snackbarOpen}
        onDismiss={handleSnackbarClose}
        duration={3000}
        style={{
          backgroundColor: 
            snackbarSeverity === "error" ? "#f44336" :
            snackbarSeverity === "success" ? "#4caf50" :
            snackbarSeverity === "warning" ? "#ff9800" : "#2196f3"
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  body: {
    marginTop: 16,
    flex: 1,
  },
});

export default ServiceProviderDashboard;