import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {WalletContextProvider} from './src/hooks/WalletContextProvider';
import ConnectWallet from './src/screens/ConnectWallet';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from './src/screens/Home';
import AddUser from './src/screens/AddUser';
import AddImage from './src/screens/AddImage';
import UploadDoc from './src/screens/UploadDoc';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <WalletContextProvider>
        <StatusBar translucent backgroundColor={'transparent'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="ConnectWallet">
          <Stack.Screen name="ConnectWallet" component={ConnectWallet} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="AddImage" component={AddImage} />
          <Stack.Screen name="AddUser" component={AddUser} />
          <Stack.Screen name="UploadDoc" component={UploadDoc} />
        </Stack.Navigator>
      </WalletContextProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: '100%',
  },
});
