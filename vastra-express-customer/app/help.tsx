import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, MessageCircle } from 'lucide-react-native';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants';

export default function HelpScreen() {
  const router = useRouter();

  const faqs = [
    {
      q: 'How do I book a pickup?',
      a: 'Go to the Home or Book tab, select your address, a nearby facility, and a convenient time slot. Confirm your booking and we will be there!'
    },
    {
      q: 'What are the service rates?',
      a: 'Rates vary by service type (Wash & Fold, Dry Clean, etc.). You can see estimated amounts in your order history after the clothes are weighed.'
    },
    {
      q: 'How long does it take?',
      a: 'Standard service takes 48-72 hours. Express service guarantees delivery within 24 hours for an additional charge.'
    },
    {
      q: 'Can I cancel my order?',
      a: 'Yes, you can cancel your order from the Order Details screen at any time before the driver is out for pickup.'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color={COLORS.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="heading-md" className="ml-2">Help & FAQ</Typography>
      </View>
      <View className="h-[0.5px] bg-border" />

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: COLORS.primaryBg }}
          >
            <HelpCircle size={28} color={COLORS.primary} strokeWidth={1.8} />
          </View>
          <Typography variant="heading-lg">How can we help?</Typography>
          <Typography variant="body-md" className="text-text-tertiary mt-1">Common questions and support</Typography>
        </View>

        {faqs.map((faq, i) => (
          <Card key={i} className="mb-3 p-5">
            <Typography variant="heading-sm" className="mb-2">{faq.q}</Typography>
            <Typography variant="body-md" className="text-text-secondary leading-5">{faq.a}</Typography>
          </Card>
        ))}

        <View className="mt-8 mb-12 p-6 rounded-2xl items-center" style={{ backgroundColor: COLORS.primary }}>
          <MessageCircle size={28} color="#fff" strokeWidth={1.8} />
          <Typography variant="heading-sm" className="text-white mt-3">Still have questions?</Typography>
          <Typography variant="body-sm" className="text-white/80 text-center mt-1 mb-5">
            Our support team is available 24/7 to assist you.
          </Typography>
          <TouchableOpacity className="bg-white px-6 py-3 rounded-xl" activeOpacity={0.8}>
            <Typography className="font-semibold" style={{ color: COLORS.primary }}>Contact Support</Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
