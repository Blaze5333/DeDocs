import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export function Header() {
  return (
    <>
      <View style={[styles.background]}>
        <Text style={styles.title} className="text-white">
          DeDocs.
        </Text>
        <Text style={styles.subtitle}>
          Secure, Decentralized Document Signing for a Trustless Future
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    paddingBottom: 40,
    paddingTop: 60,
  },
  logo: {
    overflow: 'visible',
    resizeMode: 'cover',
  },
  subtitle: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 5,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
});
