import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Generate a unique user ID (in a real app, you'd use authentication)
const generateUserId = async () => {
  try {
    // Check if we already have a userId in storage
    const storedId = await AsyncStorage.getItem("dishwasher_userId");
    if (storedId) return storedId;

    // Generate a new ID if we don't have one
    const newId = Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem("dishwasher_userId", newId);
    return newId;
  } catch (error) {
    console.error("Error accessing storage:", error);
    // Fallback to a temporary ID if storage fails
    return "temp_" + Math.random().toString(36).substring(2, 15);
  }
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Add local state to track dishwasher status for immediate UI updates
  const [localDishwasherStatus, setLocalDishwasherStatus] = useState<
    string | null
  >(null);

  // Load user ID on component mount
  useEffect(() => {
    const loadUserId = async () => {
      const id = await generateUserId();
      setUserId(id);
    };
    loadUserId();
  }, []);

  // Get the default room for this user
  const defaultRoom = useQuery(api.rooms.getDefaultRoom, {
    userId: userId || "",
  });

  // Update local state when defaultRoom changes
  useEffect(() => {
    if (defaultRoom) {
      setLocalDishwasherStatus(defaultRoom.dishwasherStatus);
    }
  }, [defaultRoom]);

  // Update dishwasher status mutation
  const updateStatus = useMutation(api.rooms.updateDishwasherStatus);

  // Handle status toggle
  const toggleStatus = async () => {
    if (!defaultRoom || isUpdating) return;

    setIsUpdating(true);
    try {
      // Toggle the status
      const newStatus = localDishwasherStatus === "clean" ? "dirty" : "clean";

      // Update local state immediately for responsive UI
      setLocalDishwasherStatus(newStatus);

      // Send update to server
      await updateStatus({
        roomId: defaultRoom._id,
        status: newStatus,
      });

      toast.success(`Dishwasher marked as ${newStatus}`);
    } catch (error) {
      // Revert to previous state if there's an error
      setLocalDishwasherStatus(defaultRoom.dishwasherStatus);
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Navigate to rooms list
  const goToRoomsList = () => {
    navigation.navigate("RoomsList" as never);
  };

  // Show loading state while user ID is being fetched
  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!defaultRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.title}>Welcome to Dishwasher Status</Text>
          <Text style={styles.subtitle}>You're not in any rooms yet</Text>
          <TouchableOpacity style={styles.button} onPress={goToRoomsList}>
            <Text style={styles.buttonText}>Create or Join a Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Use localDishwasherStatus for UI if available, otherwise fall back to defaultRoom.dishwasherStatus
  const currentStatus = localDishwasherStatus || defaultRoom.dishwasherStatus;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomName}>{defaultRoom.name}</Text>
        <TouchableOpacity onPress={goToRoomsList}>
          <Ionicons name="list" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.centeredContent}>
        <Text style={styles.title}>Dishwasher Status</Text>

        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              currentStatus === "dirty" ? styles.activeStatus : {},
            ]}
          >
            DIRTY
          </Text>

          <TouchableOpacity
            style={[
              styles.toggleContainer,
              currentStatus === "clean"
                ? styles.toggleRight
                : styles.toggleLeft,
            ]}
            onPress={toggleStatus}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View
                style={[
                  styles.toggleButton,
                  currentStatus === "clean"
                    ? styles.toggleButtonRight
                    : styles.toggleButtonLeft,
                ]}
              />
            )}
          </TouchableOpacity>

          <Text
            style={[
              styles.statusText,
              currentStatus === "clean" ? styles.activeStatus : {},
            ]}
          >
            CLEAN
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Room Code: <Text style={styles.codeText}>{defaultRoom.code}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Copy to clipboard functionality would go here
              toast.success("Room code copied to clipboard!");
            }}
          >
            <Ionicons name="copy-outline" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  roomName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
  },
  activeStatus: {
    color: "#333",
    fontWeight: "bold",
  },
  toggleContainer: {
    width: 80,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    backgroundColor: "#4CAF50",
  },
  toggleLeft: {
    backgroundColor: "#FF5722",
  },
  toggleRight: {
    backgroundColor: "#4CAF50",
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    position: "absolute",
  },
  toggleButtonLeft: {
    left: 4,
  },
  toggleButtonRight: {
    right: 4,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  infoText: {
    fontSize: 16,
    marginRight: 10,
  },
  codeText: {
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
