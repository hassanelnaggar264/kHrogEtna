import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [prefix, 'khrogetna://', 'https://khrogetna.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Discover: 'discover',
          Profile: 'profile',
        },
      },
      PlaceDetails: 'place/:id', // Deep link to Place Details
      MenuEditor: 'place/:businessId/edit-menu',
      UploadReel: 'place/:placeId/upload-reel',
      Login: 'login',
      SignUp: 'signup',
    },
  },
  async getInitialURL() {
    // Handling deferred deep linking or initial app open from link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    return null;
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => {
      subscription.remove();
    };
  },
};
