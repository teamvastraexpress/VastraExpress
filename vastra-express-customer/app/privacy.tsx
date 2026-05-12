import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { Typography } from '@/components/ui/Typography';
import { COLORS } from '@/constants';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 bg-white border-b border-brand-bubble/10 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Typography variant="heading-sm" className="ml-2">Privacy Policy</Typography>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8">
           <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-4">
              <Shield size={32} color="#22c55e" />
           </View>
           <Typography variant="heading-md">Your Privacy Matters</Typography>
        </View>

        <Typography variant="body-md" className="font-bold mb-2">1. Data Collection</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          We collect personal information such as your name, email, phone number, and address to provide our laundry services. We also collect GPS location data to facilitate accurate pickups and deliveries.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">2. Data Usage</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          Your data is used to process orders, communicate with you about your laundry status, and improve our services. We do not sell your personal data to third parties.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">3. Security</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or misuse.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">4. Your Rights</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-12 leading-5">
          You have the right to access, update, or delete your personal information at any time through the app settings or by contacting our support team.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}
