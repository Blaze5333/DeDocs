/*eslint-disable*/
import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {Shield, UserCheck, FileText, Camera} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import usePhantomConnection from '../hooks/WalletContextProvider';
import EnhancedDarkThemeBackground from './EnhancedDarkThemeBackground';

const ConnectWallet = () => {
  const {connect, phantomWalletPublicKey} = usePhantomConnection();
  const navigation = useNavigation();

  useEffect(() => {
    if (phantomWalletPublicKey) {
      navigation.navigate('Home', {
        publicKey: phantomWalletPublicKey.toString(),
      });
    }
  }, [phantomWalletPublicKey, navigation]);

  const Children = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            height: '40%',
            width: '100%',
            backgroundColor: '#4CAF50',
            borderBottomEndRadius: 50,
            borderBottomStartRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={styles.appName}>DeDocs</Text>
          <Text style={styles.title}>Secure Document Signing with Solana</Text>
        </View>
        <View style={styles.content}>
          <View
            style={[
              styles.features,
              {
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 20,
                borderColor: 'white',
                borderWidth: 1,
                padding: 15,
              },
            ]}>
            <Feature
              icon={<Shield color="#4CAF50" size={24} />}
              text="Immutable blockchain records"
            />
            <Feature
              icon={<UserCheck color="#4CAF50" size={24} />}
              text="Verified digital identities"
            />
            <Feature
              icon={<FileText color="#4CAF50" size={24} />}
              text="Tamper-proof documents"
            />
            <Feature
              icon={<Camera color="#4CAF50" size={24} />}
              text="Photo proof on IPFS"
            />
          </View>

          <Text style={styles.description}>
            Transform your document signing process with DeDocs. Connect your
            wallet to access blockchain-secured signatures, ensuring the highest
            level of authenticity and trust for all your important agreements.
          </Text>

          <TouchableOpacity style={styles.button} onPress={connect}>
            <Text style={styles.buttonText}>Connect Wallet</Text>
          </TouchableOpacity>

          <Text style={styles.securityNote}>
            Your security is our priority. All transactions are encrypted and
            secured by <Text>Solana</Text> blockchain technology.
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  return <EnhancedDarkThemeBackground children={<Children />} />;
};

const Feature = ({icon, text}) => (
  <View style={styles.feature}>
    {icon}
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // padding: 20,
  },
  content: {
    width: '100%',

    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 30,
  },
  features: {
    width: '100%',
    marginBottom: 30,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 18,
    color: '#E0E0E0',
  },
  description: {
    textAlign: 'center',
    color: '#CCCCCC',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityNote: {
    marginTop: 20,
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: 12,
  },
});

export default ConnectWallet;
