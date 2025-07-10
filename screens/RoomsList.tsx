import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function RoomsList() {
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load user ID on component mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("dishwasher_userId");
        if (id) {
          setUserId(id);
        } else {
          // If no ID exists, generate one and store it
          const newId = Math.random().toString(36).substring(2, 15);
          await AsyncStorage.setItem("dishwasher_userId", newId);
          setUserId(newId);
        }
      } catch (error) {
        console.error("Error accessing storage:", error);
        // Fallback to a temporary ID if storage fails
        setUserId("temp_" + Math.random().toString(36).substring(2, 15));
      }
    };
    loadUserId();
  }, []);

  // Get all rooms for this user
  const rooms =
    useQuery(api.rooms.getUserRooms, { userId: userId || "" }) || [];

  // Mutations
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const joinRoomMutation = useMutation(api.rooms.joinRoom);
  const setDefaultRoomMutation = useMutation(api.rooms.setDefaultRoom);

  // Create a new room
  const handleCreateRoom = async () => {
    if (!userId) return;

    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setIsLoading(true);
    try {
      await createRoomMutation({
        name: newRoomName.trim(),
        userId,
      });
      setCreateModalVisible(false);
      setNewRoomName("");
      toast.success("Room created successfully!");
    } catch (error) {
      toast.error("Failed to create room");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Join a room with code
  const handleJoinRoom = async () => {
    if (!userId) return;

    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    setIsLoading(true);
    try {
      await joinRoomMutation({
        code: roomCode.trim().toUpperCase(),
        userId,
      });
      setJoinModalVisible(false);
      setRoomCode("");
      toast.success("Joined room successfully!");
    } catch (error) {
      toast.error("Failed to join room: " + (error as Error).message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set a room as default
  const setDefaultRoom = async (roomId: Id<"rooms">) => {
    if (!userId) return;

    try {
      await setDefaultRoomMutation({ roomId, userId });
      toast.success("Default room updated");
      navigation.navigate("Home" as never);
    } catch (error) {
      toast.error("Failed to update default room");
      console.error(error);
    }
  };

  // Go back to home screen
  const goToHome = () => {
    navigation.navigate("Home" as never);
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

  // Render a room item
  const renderRoomItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.roomItem, item.isDefault && styles.defaultRoom]}
      onPress={() => setDefaultRoom(item._id)}
    >
      <View>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomCode}>Code: {item.code}</Text>
      </View>
      <View style={styles.roomStatus}>
        <View
          style={[
            styles.statusIndicator,
            item.dishwasherStatus === "clean"
              ? styles.cleanIndicator
              : styles.dirtyIndicator,
          ]}
        />
        <Text style={styles.statusText}>
          {item.dishwasherStatus === "clean" ? "Clean" : "Dirty"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToHome}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Rooms</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't joined any rooms yet
            </Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.joinButton]}
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={styles.buttonText}>Join Room</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.buttonText}>Create Room</Text>
        </TouchableOpacity>
      </View>

      {/* Create Room Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Room Name"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        visible={joinModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Room Code"
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setJoinModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinRoom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  roomItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultRoom: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  roomName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 14,
    color: "#666",
  },
  roomStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  cleanIndicator: {
    backgroundColor: "#4CAF50",
  },
  dirtyIndicator: {
    backgroundColor: "#FF5722",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  joinButton: {
    backgroundColor: "#FF9800",
  },
  createButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#9E9E9E",
  },
  confirmButton: {
    backgroundColor: "#2196F3",
  },
});
