import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { Typography } from '@/components/ui/Typography';
import { COLORS } from '@/constants';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 bg-white border-b border-brand-bubble/10 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Typography variant="heading-sm" className="ml-2">Terms of Service</Typography>
      </View>

      <ScrollView className="flex-1 p-6">
        <Typography variant="body-md" className="font-bold mb-2">1. Acceptance of Terms</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          By using Vastra Express, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">2. Service Description</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          Vastra Express provides on-demand laundry and dry cleaning services. We reserve the right to modify or discontinue any part of the service at any time.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">3. User Responsibilities</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          You are responsible for providing accurate information and ensuring that your clothes are suitable for the requested service. We are not liable for damage to items with pre-existing issues or improper care labels.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">4. Payments and Refunds</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-6 leading-5">
          Pricing is based on weight or per-item rates. Payments are due upon service completion. Refund requests will be evaluated on a case-by-case basis.
        </Typography>

        <Typography variant="body-md" className="font-bold mb-2">5. Limitation of Liability</Typography>
        <Typography variant="body-sm" className="text-text-mid mb-12 leading-5">
          Vastra Express shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}
