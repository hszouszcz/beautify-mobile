import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { app } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: app.colors.accent,
        tabBarInactiveTintColor: app.colors.textFaint,
        tabBarStyle: [styles.tabBar, { backgroundColor: app.colors.surface, borderTopColor: app.colors.outline }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="safari" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: t('tabs.find'),
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {},
});
