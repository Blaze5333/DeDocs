/*eslint-disable*/
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  ToastAndroid,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
  Animated,
} from 'react-native';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import EnhancedDarkThemeBackground from './EnhancedDarkThemeBackground';
import AccountInfo from '../components/AccountInfo';
import { CONNECTION, getUserPDA, imageURI } from '../components/constants';
import usePhantomConnection from '../hooks/WalletContextProvider';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import idl from '../../contracts/idl/idl.json';
import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import { LinearGradient } from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = (width - 60) / 2;
const HEADER_HEIGHT = 120; // Adjust based on your AccountInfo component height

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Home({ route }) {
  // ... (keep the existing state and hooks)
  const {width, height} = Dimensions.get('window');
  const {publicKey} = route.params;
  const {signAndSendTransaction, signAllTransactions, phantomWalletPublicKey} =
    usePhantomConnection();
  const navigation = useNavigation();
  const [loggedin, setloggedin] = useState(false);
  const [documents, setdocuments] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const customProvider = {
    publicKey: new PublicKey(phantomWalletPublicKey),
    signTransaction: signAndSendTransaction,
    signAllTransactions: signAllTransactions,
    connection: CONNECTION,
  };

  const program = new Program(
    idl,
    'Ch57PUCAvh6SCZ3DNroq7gXH9a1svdkykVabscVxdsEC',
    customProvider,
  );

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (loggedin) {
      getDocs();
    }
  }, [loggedin]);

  useFocusEffect(
    useCallback(() => {
      if (loggedin) {
        getDocs();
      }
    }, [loggedin, getDocs]),
  );

  const getDocs = async () => {
    const docs = await firestore().collection('documents').get();
    console.log(docs.docs.length);
    const docPDAs = docs.docs.map(doc => new PublicKey(doc.data().documentPDA));
    console.log(docPDAs);
    console.log(docs.docs[0].data().documentPDA);
    const arr = [];
    const detaildocs = await program.account.document.fetchMultiple(docPDAs);
    console.log(detaildocs);
    let i = 0;
    detaildocs.forEach(doc => {
      if (doc.signers.toString().includes(phantomWalletPublicKey.toString())) {
        arr.push({...doc});
      }
      i++;
    });
    arr.push({"date": "019260585376", "id": "01926058534a", "imageHash": "QmQ1z7J7GNtALcHnrL8kZjgkGMLymbC5NPN82uwRNq2CkA", "signers": ["8RrgQYBoZezgfpB9x77EYGyMW9Rp1WUWubP22uCnqjHi"], "uploader": "8RrgQYBoZezgfpB9x77EYGyMW9Rp1WUWubP22uCnqjHi"})
    setdocuments(arr);
  };
  const checkUser = async pubKey => {
    const program = new Program(
      idl,
      'Ch57PUCAvh6SCZ3DNroq7gXH9a1svdkykVabscVxdsEC',
      // '2ooqk3QB9KVqcwKE8EnxDNoUnTAMfTH43qmqtMA1T1zk',
      {
        publicKey: new PublicKey(phantomWalletPublicKey),
        signTransaction: signAndSendTransaction,
        signAllTransactions: signAllTransactions,
        connection: CONNECTION,
      },
    );
    try {
      const userPDA = await getUserPDA(phantomWalletPublicKey);
      console.log('userPDA', userPDA.toString());
      let user = '';
      user = await program.account.userPhoto.fetch(new PublicKey(userPDA));
      console.log('user', user);
      if (user) {
        setloggedin(true);
      }
    } catch (error) {
      console.log('error', error);
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
      });
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
      formData.append(
        'walletAddresses',
        JSON.stringify(phantomWalletPublicKey),
      );

      try {
        const response = await axios.post(
          'https://dedox-backend.onrender.com/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data.success === true) {
          console.log('Image uploaded successfully:', response.data);
          console.log('IPFS Hash:', response.data.ipfsHash);

          ToastAndroid.show('Image Uploaded Successfully!', ToastAndroid.SHORT);
          const getuserPDA = await getUserPDA(
            new PublicKey(phantomWalletPublicKey),
          );
          const transaction = new Transaction();
          const tx = await program.methods
            .addUserPhoto(imageURI + response.data.ipfsHash)
            .accounts({
              user: new PublicKey(phantomWalletPublicKey),
              userPhoto: new PublicKey(getuserPDA),
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          transaction.add(tx);

          transaction.feePayer = new PublicKey(phantomWalletPublicKey);
          const {blockhash, lastValidBlockHeight} =
            await CONNECTION.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          console.log('Transaction before sending to Phantom:', transaction);
          try {
            const signedTransaction = await signAndSendTransaction(transaction);
            console.log('Signed transaction:', signedTransaction);
            Alert.alert('Success', 'User photo added successfully');
            setloggedin(true);
          } catch (signError) {
            console.error('Error signing or sending transaction:', signError);
            Alert.alert(
              'Error',
              'Failed to sign or send transaction: ' + signError.message,
            );
          }
        } else {
          alert('Failed to upload. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload. Please try again.');
      } finally {
        // setUploading(false);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getDocs().then(() => setRefreshing(false));
  }, [getDocs]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const renderDocument = useCallback(({ item, index }) => {
    const inputRange = [
      -1,
      0,
      ITEM_HEIGHT * index,
      ITEM_HEIGHT * (index + 2)
    ];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.9],
      extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('DocumentDetail', {
            imageUri: imageURI + item.imageHash,
            signers: item.signers.toString(),
            uploader: item.uploader.toString(),
            docId: item.id.toString(),
          })
        }
        style={[styles.documentItem, { transform: [{ scale }], opacity }]}
      >
        <Image
          source={{ uri: imageURI + item.imageHash }}
          style={styles.documentImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.documentOverlay}
        >
          <Text style={styles.documentText} numberOfLines={1}>
            Doc {item.id.toString().slice(0, 8)}
          </Text>
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }, [navigation, imageURI]);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const Children = () => (
    <View style={styles.container}>
      {!loggedin ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            Uploading user data on Solana...
          </Text>
        </View>
      ) : (
        <>
          <Animated.View style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
            }
          ]}>
            <AccountInfo publicKey={publicKey} />
          </Animated.View>
          {documents && (
            <Animated.FlatList
              ref={flatListRef}
              data={documents}
              numColumns={2}
              keyExtractor={(item) => item.toString()}
              renderItem={renderDocument}
              contentContainerStyle={[
                styles.documentList,
                { paddingTop: HEADER_HEIGHT+150 }
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4CAF50']}
                />
              }
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              style={{ transform: [{ translateY: contentTranslateY }] }}
            />
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddImage', { publicKey })}
            style={styles.addButton}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.addButtonGradient}
            >
              <IconButton icon="plus" size={30} iconColor="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return <EnhancedDarkThemeBackground children={<Children />} />;
}

const styles = {
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    position: 'absolute',
    top: StatusBar.currentHeight,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1000,
    padding: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 14,
  },
  documentList: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  documentItem: {
    height: ITEM_HEIGHT,
    width: (width - 60) / 2,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,

  },
  documentImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  documentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  documentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  documentSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 30,
    elevation: 8,
  },
  addButtonGradient: {
    borderRadius: 30,
    padding: 5,
  },
};


