import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, height: 68, paddingTop: 6, paddingBottom: 12 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="dashboard" options={{
        title: 'Panel',
        tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
      }} />
      <Tabs.Screen name="employees" options={{
        title: 'Çalışan',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
      }} />
      <Tabs.Screen name="workplaces" options={{
        title: 'İşyerleri',
        tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
      }} />
      <Tabs.Screen name="requests" options={{
        title: 'İzinler',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'Rapor',
        tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
