import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Briefcase, GraduationCap, Users, MessageSquare, Plus, Code, Bell, UserCheck } from 'lucide-react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { View, ActivityIndicator, TouchableOpacity, Image, Text } from 'react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import WorkshopsScreen from '../screens/WorkshopsScreen';
import ConnectStudentsScreen from '../screens/ConnectStudentsScreen';
import ProfileDashboardScreen from '../screens/ProfileDashboardScreen';
import MessagesScreen from '../screens/MessagesScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import StartupHub from '../pages/StartupHub';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dummy component for the AddPost tab
const DummyComponent = () => null;

function TabNavigator({ navigation }) {
  const [avatar, setAvatar] = useState('https://randomuser.me/api/portraits/men/46.jpg');

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'profiles'), where('uid', '==', auth.currentUser.uid));
      getDocs(q).then(querySnapshot => {
        if (!querySnapshot.empty) {
          setAvatar(querySnapshot.docs[0].data().imageUrl || 'https://randomuser.me/api/portraits/men/46.jpg');
        }
      }).catch(console.error);
    }
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        headerTitle: '',
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
            <Image source={require('../../assets/images/logo.jpg')} style={{ width: 30, height: 30, marginRight: 8 }} resizeMode="contain" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0a66c2' }}>CodersHub</Text>
          </View>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Connect')} style={{ marginRight: 16 }}>
              <UserCheck size={24} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Bell size={24} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={{ uri: avatar }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb' }}
              />
            </TouchableOpacity>
          </View>
        ),
        tabBarIcon: ({ color, size }) => {
          let IconComponent;
          if (route.name === 'Feed') IconComponent = Home;
          else if (route.name === 'Projects') IconComponent = Briefcase;
          else if (route.name === 'Workshops') IconComponent = GraduationCap;
          else if (route.name === 'Messages') IconComponent = MessageSquare;

          if (IconComponent) {
            return <IconComponent size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#0a66c2',
        tabBarInactiveTintColor: 'gray',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />

      {/* Floating Plus Button (Centered) */}
      <Tab.Screen
        name="AddPost"
        component={DummyComponent}
        options={{
          tabBarIcon: () => (
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#0a66c2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 5
            }}>
              <Plus size={24} color="white" />
            </View>
          ),
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={[props.style, { justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => navigation.navigate('CreatePostModal')}
            />
          )
        }}
      />

      <Tab.Screen name="Workshops" component={WorkshopsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a66c2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileDashboardScreen} />
            <Stack.Screen 
              name="Connect" 
              component={ConnectStudentsScreen} 
              options={{ 
                headerShown: true, 
                headerTitle: 'Connections',
                headerBackTitleVisible: false,
                headerTintColor: '#0a66c2',
              }} 
            />
            <Stack.Screen
              name="CreatePostModal"
              component={CreatePostScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="StartupHub" 
              component={StartupHub} 
              options={{ 
                headerShown: true, 
                headerTitle: 'Startup Hub',
                headerBackTitleVisible: false,
                headerTintColor: '#0a66c2',
              }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
