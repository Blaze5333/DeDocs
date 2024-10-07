/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { BN, Program } from '@project-serum/anchor';
import Clipboard from '@react-native-clipboard/clipboard';
import usePhantomConnection from '../hooks/WalletContextProvider';
import {
  CONNECTION,
  getDocSignedPDA,
  getUserPDA,
  programId,
} from '../components/constants';
import idl from '../../contracts/idl/idl.json';
import Icon from 'react-native-vector-icons/Feather';
import EnhancedDarkThemeBackground from './EnhancedDarkThemeBackground';
import { Chrome } from 'lucide-react-native';
import { Icon as PIcon } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = SCREEN_WIDTH - 40;
const BUTTON_HEIGHT = 60;
const SLIDER_WIDTH = 60;

const DocumentDetail = ({ route, navigation }) => {
  const [docId, setDocId] = useState(route.params.docId);
  const [signers, setSigners] = useState();
  const [uploader, setUploader] = useState(null);
  const [imageUrl, setImageUrl] = useState(route.params.imageUri);
  const [modalVisible, setModalVisible] = useState(false);

  const { phantomWalletPublicKey, signAllTransactions, signAndSendTransaction } =
    usePhantomConnection();
  const pubKey = new PublicKey(phantomWalletPublicKey);
  const customProvider = {
    publicKey: pubKey,
    signTransaction: signAndSendTransaction,
    signAllTransactions: signAllTransactions,
    connection: CONNECTION,
  };
  const program = new Program(idl, programId.toString(), customProvider);

  const translateX = useSharedValue(0);

  useEffect(() => {
    fetchDocumentDetails();
  }, []);

  const fetchDocumentDetails = async () => {
    try {
      const uploaderPDA = await getUserPDA(
        new PublicKey(route.params.uploader),
      );
      const uploaderData = await program.account.userPhoto.fetch(uploaderPDA);
      console.log('Uploader data fetched:', uploaderData);

      setUploader({
        user: route.params.uploader,
        imageUrl: uploaderData.imageHash.toString(),
      });

      const signerArray = [];
      const signers1 = route.params.signers.split(',');
      console.log('Signers:', signers1);

      for (let i = 0; i < signers1.length; i++) {
        try {
          const signerPDA = await getUserPDA(new PublicKey(signers1[i]));
          const signerData = await program.account.userPhoto.fetch(signerPDA);
          console.log('Signer data fetched:', signerData);

          let signed = false;
          let signedDocData = null;

          try {
            const signedDocPDA = await getDocSignedPDA(
              new PublicKey(signers1[i]),
              docId,
            );
            signedDocData = await program.account.signedDocument.fetch(
              signedDocPDA,
            );
            console.log('Signed document data:', signedDocData);
            signed = true;
          } catch (docError) {
            console.log('Document not signed:', docError.message);
          }

          const signerInfo = {
            signed,
            user: signers1[i].toString(),
            imageUrl: signerData.imageHash.toString(),
          };
          signerArray.push(signerInfo);
        } catch (signerError) {
          console.error('Error fetching signer data:', signerError.message);
          signerArray.push({
            signed: false,
            user: signers1[i].toString(),
            imageUrl: 'default_image_url',
            error: true,
          });
        }
      }

      console.log('Array', signerArray);
      setSigners(signerArray);
    } catch (error) {
      console.error('Error in fetchDocumentDetails:', error);
    }
  };

  const signDocument = async () => {
    if (!phantomWalletPublicKey) {
      ToastAndroid.show('Wallet not connected', ToastAndroid.SHORT);
      return;
    }
    try {
      const pubKey = new PublicKey(phantomWalletPublicKey);
      const documentId = docId;
      console.log('Using public key:', pubKey.toString());
      const [documentPDA, bump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('signeddocument'),
          pubKey.toBuffer(),
          new BN(documentId).toArrayLike(Buffer, 'le', 8),
        ],
        new PublicKey(programId),
      );

      const transaction = new Transaction();
      const customProvider = {
        publicKey: pubKey,
        signTransaction: signAndSendTransaction,
        signAllTransactions: signAllTransactions,
        connection: CONNECTION,
      };

      console.log('reached here', pubKey);
      const program = new Program(
        idl,
        'Ch57PUCAvh6SCZ3DNroq7gXH9a1svdkykVabscVxdsEC',
        customProvider,
      );
      const tx = await program.methods
        .addSignedDocument(new BN(documentId), pubKey)
        .accounts({
          signedDocument: documentPDA,
          user: pubKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      transaction.add(tx);
      transaction.feePayer = pubKey;
      const { blockhash, lastValidBlockHeight } =
        await CONNECTION.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      try {
        const signedTransaction = await signAndSendTransaction(transaction);
        console.log('Signed transaction:', signedTransaction);
        ToastAndroid.show('Document signed successfully', ToastAndroid.SHORT);
        navigation.navigate('Home', { publicKey: pubKey.toString() });
      } catch (signError) {
        console.error('Error signing or sending transaction:', signError);
        ToastAndroid.show(
          'Failed to sign or send transaction: ' + signError.message,
          ToastAndroid.SHORT,
        );
      }
    } catch (error) {
      console.error('Error preparing transaction:', error);
      ToastAndroid.show('Failed to prepare transaction: ' + error.message, ToastAndroid.SHORT);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = Math.max(
        0,
        Math.min(context.startX + event.translationX, BUTTON_WIDTH - SLIDER_WIDTH)
      );
    },
    onEnd: () => {
      if (translateX.value > BUTTON_WIDTH - SLIDER_WIDTH - 50) {
        translateX.value = withSpring(BUTTON_WIDTH - SLIDER_WIDTH);
        runOnJS(signDocument)();
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, BUTTON_WIDTH - SLIDER_WIDTH],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const renderSigner = (signer, index) => (
    
    <View key={index} style={styles.signerContainer}>
      <Image source={{ uri: signer.imageUrl }} style={styles.avatar} />
      <View style={styles.signerInfo}>
        <Text style={styles.signerName}>{signer.user.substring(0, 4)}...{signer.user.substring(signer.user.length - 4)}</Text>
        <View style={[styles.statusBadge, signer.signed ? styles.signedBadge : styles.unsignedBadge]}>
          <Text style={styles.statusText}>{signer.signed ? 'Signed' : 'Not Signed'}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          Clipboard.setString(signer.user);
          ToastAndroid.show('Address copied to clipboard', ToastAndroid.SHORT);
        }}
      >
        <Icon name="copy" size={20} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );
const Children=()=>{return(<GestureHandlerRootView>
  <View style={styles.container}>
  <StatusBar barStyle="light-content" />
  <ScrollView contentContainerStyle={styles.scrollContent}>
    <Text style={styles.title}>Document Details</Text>
    
    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.documentPreview}>
      <Image source={{ uri: imageUrl }} style={styles.documentImage} />
      <LinearGradient
        colors={['transparent', 'rgba(76, 175, 80, 0.8)']}
        style={styles.previewOverlay}
      >
        <Icon name="eye" size={24} color="white" />
        <Text style={styles.previewText}>View Document</Text>
      </LinearGradient>
    </TouchableOpacity>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Uploader</Text>
      {uploader && (
        <View style={styles.uploaderContainer}>
          <Image source={{ uri: uploader.imageUrl }} style={styles.avatar} />
          <Text style={styles.uploaderName}>
            {uploader.user.substring(0, 4)}...{uploader.user.substring(uploader.user.length - 4)}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(uploader.user);
              ToastAndroid.show('Address copied to clipboard', ToastAndroid.SHORT);
            }}
          >
            <Icon name="copy" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      )}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Signers</Text>
      {signers&&signers.map(renderSigner)}
    </View>

    {signers &&
      !signers.filter(
        item =>
          item.user.toString() === phantomWalletPublicKey.toString(),
      )[0]?.signed && (
        <View style={styles.signButtonContainer}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={styles.signButton}>
              <Animated.View style={[styles.slider, sliderStyle]}>
                <Icon name="chevrons-right" size={35} color="#4CAF50" />
              </Animated.View>
              <Animated.Text style={[styles.signButtonText, textOpacity]}>
                Slide to Sign
              </Animated.Text>
            </Animated.View>
          </PanGestureHandler>
        </View>
      )}
  </ScrollView>

  <Modal
    animationType="fade"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setModalVisible(false)}
      >
        <Icon name="x" size={24} color="white" />
      </TouchableOpacity>
    </View>
  </Modal>
</View>
</GestureHandlerRootView>
)}
  return (
    <EnhancedDarkThemeBackground children={<Children/>} />
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#1E1E1E', // Dark background
    paddingTop:StatusBar.currentHeight
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 15,
  },
  previewText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  uploaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  uploaderName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
  },
  signerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  signerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  signerName: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  signedBadge: {
    backgroundColor: '#4CAF50',
  },
  unsignedBadge: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signButton: {
    width: BUTTON_WIDTH+4,
    height: BUTTON_HEIGHT+4,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding:2
  },
  slider: {
    position: 'absolute',
    width: SLIDER_WIDTH - 4,
    height: SLIDER_WIDTH - 4,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    left:2,
    
  },
  signButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 20,
    padding: 10,
  },
});

export default DocumentDetail;