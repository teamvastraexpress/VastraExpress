import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { colors } from '@/lib/utils';
import { Phone, Mail, Briefcase, Building2, BadgeCheck, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, setAuth, token, logout } = useAuthStore();

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      if (token) setAuth(res.data, token);
    } catch {
      Alert.alert('Error', 'Could not refresh profile');
    }
  }, [token, setAuth]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  if (!user) return <Loading label="Loading profile..." />;

  const roleName = typeof user.role === 'string' ? user.role : user.role?.name ?? 'Driver';
  const staff = user.staffProfile;

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: () => { logout(); router.replace('/(auth)/login'); },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>My Profile</Text>
        <Text style={s.pageSubtitle}>Your account details</Text>

        {/* Avatar + Name */}
        <Card style={s.cardPad}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.name?.charAt(0)?.toUpperCase() ?? 'D'}</Text>
            </View>
            <View>
              <Text style={s.userName}>{user.name ?? 'Driver'}</Text>
              <View style={s.badgeRow}>
                <View style={s.roleBadge}>
                  <Text style={s.roleBadgeText}>{roleName}</Text>
                </View>
                {user.isActive && (
                  <View style={s.activeBadge}>
                    <BadgeCheck size={12} color={colors.green700} />
                    <Text style={s.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Info */}
        <Card style={s.cardPad}>
          <Text style={s.sectionTitle}>Contact Information</Text>
          <View style={s.infoList}>
            <View style={s.infoItem}>
              <Phone size={16} color={colors.gray400} />
              <View><Text style={s.infoLabel}>Mobile Number</Text><Text style={s.infoValue}>{user.mobileNumber}</Text></View>
            </View>
            {user.email && (
              <View style={s.infoItem}>
                <Mail size={16} color={colors.gray400} />
                <View><Text style={s.infoLabel}>Email</Text><Text style={s.infoValue}>{user.email}</Text></View>
              </View>
            )}
          </View>
        </Card>

        {/* Staff Info */}
        {staff && (
          <Card style={s.cardPad}>
            <Text style={s.sectionTitle}>Employment Details</Text>
            <View style={s.infoList}>
              {staff.employeeId && (
                <View style={s.infoItem}>
                  <Briefcase size={16} color={colors.gray400} />
                  <View><Text style={s.infoLabel}>Employee ID</Text><Text style={s.infoValue}>{staff.employeeId}</Text></View>
                </View>
              )}
              {staff.facility && (
                <View style={s.infoItem}>
                  <Building2 size={16} color={colors.gray400} />
                  <View><Text style={s.infoLabel}>Assigned Facility</Text><Text style={s.infoValue}>{staff.facility.name}</Text></View>
                </View>
              )}
            </View>
          </Card>
        )}

        <Text style={s.footerNote}>
          To update your profile details, please contact your admin or facility manager.
        </Text>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <LogOut size={16} color={colors.red600} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  pageSubtitle: { fontSize: 13, color: colors.gray500, marginTop: -8 },
  cardPad: { padding: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.violet100, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.violet700 },
  userName: { fontSize: 18, fontWeight: '700', color: colors.gray900 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleBadge: { backgroundColor: colors.violet100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: colors.violet700 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.green700 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 12 },
  infoList: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 11, color: colors.gray400 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.gray900 },
  footerNote: { fontSize: 11, color: colors.gray400, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.red200, paddingVertical: 14 },
  logoutText: { fontSize: 14, fontWeight: '500', color: colors.red600 },
});
