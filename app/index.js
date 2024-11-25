import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification Permissions
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function EventReminderApp() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [reminderInput, setReminderInput] = useState(''); // To store the manual date and time input

  useEffect(() => {
    // Fetch events from AsyncStorage when the app loads
    const loadEvents = async () => {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    };

    loadEvents();
  }, []);

  const addEvent = async () => {
    if (!eventName || !reminderInput) {
      Alert.alert('Error', 'Please enter all fields');
      return;
    }
  
    // Parse the entered date and time
    const parsedDate = new Date(reminderInput);
    if (isNaN(parsedDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid date and time in the format YYYY-MM-DD HH:mm');
      return;
    }
  
    if (parsedDate <= new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time');
      return;
    }
  
    const newEvent = { id: Date.now().toString(), name: eventName, reminder: parsedDate.toString() };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
  
    // Save events to AsyncStorage
    await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
  
    setEventName('');
    setReminderInput('');
  
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Event Reminder: ${eventName}`,
        body: `Don't forget to attend the event: ${eventName}.`,
      },
      trigger: { date: parsedDate }, // Trigger at the specific date and time
    });
  
    // Save the notification ID along with the event
    const eventWithNotification = { ...newEvent, notificationId };
    const finalEvents = updatedEvents.map(event =>
      event.id === newEvent.id ? eventWithNotification : event
    );
    await AsyncStorage.setItem('events', JSON.stringify(finalEvents));
  };
  

  const removeEvent = async (id, notificationId) => {
    // Remove the event from the list
    const updatedEvents = events.filter((event) => event.id !== id);
    setEvents(updatedEvents);

    // Remove the event from AsyncStorage
    await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));

    // Cancel the scheduled notification
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  return (
    <View style={styles.container}>
      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Event Name"
          value={eventName}
          onChangeText={setEventName}
        />

        {/* Input field for date and time */}
        <TextInput
          style={styles.input}
          placeholder="Enter Date and Time (YYYY-MM-DD HH:mm)"
          value={reminderInput}
          onChangeText={setReminderInput}
        />

        <Pressable style={styles.addButton} onPress={addEvent}>
          <Text style={styles.addButtonText}>Add Event</Text>
        </Pressable>
      </View>

      {/* Event List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <Text style={styles.eventText}>
              {item.name} - {new Date(item.reminder).toLocaleString()}
            </Text>
            <Pressable onPress={() => removeEvent(item.id, item.notificationId)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 250,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  eventItem: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventText: {
    fontSize: 16,
    color: '#388e3c',
  },
  removeText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});
