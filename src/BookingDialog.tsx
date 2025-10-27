/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (bookingDetails: any) => void;
  selectedOption: string;
  onOptionChange: (val: string) => void;
  startDate: string | null;
  endDate: string | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  setStartDate: (val: string | null) => void;
  setEndDate: (val: string | null) => void;
  setStartTime: (val: Dayjs | null) => void;
  setEndTime: (val: Dayjs | null) => void;
}

const isBookingValid = (time: Dayjs | null) => {
  if (!time) return false;
  const now = dayjs();
  if (time.isBefore(now.add(30, "minute").subtract(1, "second"))) return false;
  const hour = time.hour();
  return hour >= 5 && hour < 22; // 5 AM–10 PM
};

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onClose,
  onSave,
  selectedOption,
  onOptionChange,
  startDate,
  endDate,
  startTime,
  endTime,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
}) => {
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);
  const [lastSelectedDate, setLastSelectedDate] = useState<Dayjs | null>(null);

  const today = dayjs();
  const maxDate21Days = today.add(21, "day");
  const maxDate90Days = today.add(89, "day");

  const updateStartDate = (newValue: Dayjs) => {
    let adjustedTime = newValue;
    if (newValue.isSame(today, "day")) {
      const nowPlus30 = today.add(30, "minute");
      if (newValue.isBefore(nowPlus30)) adjustedTime = nowPlus30;
      if (adjustedTime.hour() < 5) adjustedTime = adjustedTime.hour(5).minute(0);
      else if (adjustedTime.hour() >= 22)
        adjustedTime = adjustedTime.hour(21).minute(55);
    } else {
      adjustedTime = adjustedTime.hour(5).minute(0);
    }

    setStartDate(adjustedTime.toISOString());
    setStartTime(adjustedTime);
    setLastSelectedDate(adjustedTime);

    const defaultEnd = adjustedTime.add(1, "hour");
    setEndDate(defaultEnd.toISOString());
    setEndTime(defaultEnd);

    if (selectedOption === "Monthly") {
      const endDateValue = adjustedTime.add(1, "month");
      setEndDate(endDateValue.toISOString());
      setEndTime(endDateValue);
    }
  };

  const updateEndDate = (newValue: Dayjs) => {
    setEndDate(newValue.toISOString());
    setEndTime(newValue);
  };

  const isConfirmDisabled = () => {
    switch (selectedOption) {
      case "Date":
        return !startDate || !startTime;
      case "Short term":
        if (!startDate || !endDate || !startTime || !endTime) return true;
        return dayjs(endDate).isBefore(dayjs(startDate));
      case "Monthly":
        return !startDate || !startTime;
      default:
        return true;
    }
  };

  const handleAccept = () => {
    if (startTime && !isBookingValid(startTime)) {
      Alert.alert(
        "Invalid Time",
        "Please select a time between 5 AM and 10 PM, at least 30 minutes from now"
      );
      return;
    }

    onSave({
      option: selectedOption,
      startDate,
      endDate,
      startTime,
      endTime,
    });
  };

  const getDuration = () => {
    if (!startTime || !endTime) return 1;
    return endTime.diff(startTime, "hour");
  };

  const renderDatePicker = (type: "start" | "end") => (
    <DateTimePicker
      value={
        type === "start"
          ? startTime
            ? new Date(startTime.toISOString())
            : new Date()
          : endTime
          ? new Date(endTime.toISOString())
          : new Date()
      }
      mode="datetime"
      display={Platform.OS === "ios" ? "inline" : "default"}
      minimumDate={
        type === "start"
          ? new Date()
          : startDate
          ? new Date(dayjs(startDate).add(1, "hour").toISOString())
          : new Date()
      }
      maximumDate={
        selectedOption === "Monthly"
          ? new Date(maxDate90Days.toISOString())
          : new Date(maxDate21Days.toISOString())
      }
      onChange={(event, date) => {
        if (!date) return setShowPicker(null);
        const newValue = dayjs(date);
        if (type === "start") updateStartDate(newValue);
        else updateEndDate(newValue);
        setShowPicker(null);
      }}
    />
  );

  const duration = getDuration();

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Select your Booking Option</Text>

            {/* Radio options */}
            <View style={styles.radioRow}>
              {["Date", "Short term", "Monthly"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.radioOption,
                    selectedOption === opt && styles.radioOptionSelected,
                  ]}
                  onPress={() => onOptionChange(opt)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      selectedOption === opt && styles.radioTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DATE Option */}
            {selectedOption === "Date" && (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("start")}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate
                      ? `Start: ${dayjs(startDate).format("MMM D, YYYY h:mm A")}`
                      : "Select Start Date"}
                  </Text>
                </TouchableOpacity>

                {showPicker === "start" && renderDatePicker("start")}

                {startDate && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <Text style={styles.sectionText}>
                      Start Date:{" "}
                      {dayjs(startDate).format("MMMM D, YYYY [at] h:mm A")}
                    </Text>
                    <Text style={styles.sectionText}>
                      Duration: {duration} hour{duration > 1 ? "s" : ""}
                    </Text>

                    <View style={styles.durationRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => {
                          if (startTime && endTime && duration > 1) {
                            const newEnd = startTime.add(duration - 1, "hour");
                            setEndTime(newEnd);
                            setEndDate(newEnd.toISOString());
                          }
                        }}
                      >
                        <Text style={styles.adjustText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.durationText}>
                        {duration} hour{duration > 1 ? "s" : ""}
                      </Text>

                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => {
                          if (startTime && endTime) {
                            const newEnd = startTime.add(duration + 1, "hour");
                            if (newEnd.hour() < 22) {
                              setEndTime(newEnd);
                              setEndDate(newEnd.toISOString());
                            }
                          }
                        }}
                      >
                        <Text style={styles.adjustText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* SHORT TERM */}
            {selectedOption === "Short term" && (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("start")}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate
                      ? `Start: ${dayjs(startDate).format("MMM D, YYYY h:mm A")}`
                      : "Select Start Date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("end")}
                >
                  <Text style={styles.dateButtonText}>
                    {endDate
                      ? `End: ${dayjs(endDate).format("MMM D, YYYY h:mm A")}`
                      : "Select End Date"}
                  </Text>
                </TouchableOpacity>

                {showPicker && renderDatePicker(showPicker)}
              </>
            )}

            {/* MONTHLY */}
            {selectedOption === "Monthly" && (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("start")}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate
                      ? `Start: ${dayjs(startDate).format("MMM D, YYYY h:mm A")}`
                      : "Select Start Date"}
                  </Text>
                </TouchableOpacity>
                {showPicker === "start" && renderDatePicker("start")}
              </>
            )}

            {/* Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isConfirmDisabled() && styles.disabledButton,
                ]}
                onPress={handleAccept}
                disabled={isConfirmDisabled()}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BookingDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    width: Dimensions.get("window").width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.85,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  radioRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  radioOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  radioOptionSelected: {
    backgroundColor: "#007AFF20",
    borderColor: "#007AFF",
  },
  radioText: {
    fontSize: 14,
    color: "#333",
  },
  radioTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  dateButtonText: {
    fontSize: 15,
    color: "#333",
  },
  confirmBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 3,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  adjustButton: {
    backgroundColor: "#007AFF20",
    padding: 10,
    borderRadius: 6,
  },
  adjustText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  durationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  cancelText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});
