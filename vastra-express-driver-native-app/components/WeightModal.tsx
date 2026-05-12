import React, { useState } from 'react';
import {
  View, Text, TextInput, Modal, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Button } from './Button';
import { colors } from '@/lib/utils';

interface WeightModalProps {
  visible: boolean;
  loading: boolean;
  onConfirm: (weight: number) => void;
  onCancel: () => void;
}

export function WeightModal({ visible, loading, onConfirm, onCancel }: WeightModalProps) {
  const [value, setValue] = useState('');
  const parsed = parseFloat(value);
  const valid = parsed > 0 && parsed < 200;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Enter Laundry Weight</Text>
          <Text style={styles.subtitle}>Weigh the bag and enter the measured weight in kg.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={colors.gray400}
              value={value}
              onChangeText={setValue}
              autoFocus
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          <Button variant="success" size="lg" loading={loading} disabled={!valid}
            onPress={() => valid && onConfirm(parsed)} style={{ width: '100%', marginBottom: 8 }}>
            Confirm Pickup
          </Button>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.primary400, borderRadius: 12, backgroundColor: colors.violet50, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.gray900, paddingVertical: 14 },
  unit: { fontSize: 16, fontWeight: '600', color: colors.gray500 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, color: colors.gray500 },
});
