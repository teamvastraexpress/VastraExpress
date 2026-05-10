import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react-native';
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
    <SafeAreaView className="flex-1 bg-offwhite">
      <View className="px-6 py-4 bg-white border-b border-brand-bubble/10 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Typography variant="heading-sm" className="ml-2">Help & FAQ</Typography>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8">
           <View className="w-20 h-20 bg-brand-hero rounded-full items-center justify-center mb-4">
              <HelpCircle size={40} color={COLORS.primary} />
           </View>
           <Typography variant="heading-md">How can we help?</Typography>
           <Typography variant="body-sm" className="text-text-light mt-1">Common questions and support</Typography>
        </View>

        {faqs.map((faq, i) => (
          <Card key={i} className="mb-4 p-4">
            <Typography variant="heading-sm" className="text-base mb-2">{faq.q}</Typography>
            <Typography variant="body-sm" className="text-text-mid leading-5">{faq.a}</Typography>
          </Card>
        ))}

        <View className="mt-6 mb-12 p-6 bg-brand-blue rounded-3xl items-center">
           <Typography variant="heading-sm" className="text-white">Still have questions?</Typography>
           <Typography variant="body-sm" className="text-white/80 text-center mt-1 mb-4">
             Our support team is available 24/7 to assist you with your laundry needs.
           </Typography>
           <TouchableOpacity className="bg-white px-6 py-3 rounded-xl">
              <Typography className="text-brand-blue font-bold">Contact Support</Typography>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
