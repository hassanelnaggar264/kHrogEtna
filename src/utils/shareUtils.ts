import Share from 'react-native-share';
import * as Linking from 'expo-linking';

// Generates a universal link pointing to this business
export const generateBusinessDeepLink = (businessId: string) => {
  // Use expo-linking to construct a deep link to the business profile
  // Example result: khrogetna://business/seed_b1
  return Linking.createURL(`business/${businessId}`);
};

export const shareToWhatsApp = async (businessName: string, businessId: string) => {
  const deepLink = generateBusinessDeepLink(businessId);
  const message = `Check out ${businessName} on 2Where?! Discover places based on mood 👑\n\nLink: ${deepLink}`;
  
  try {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback
      await Share.open({ message });
    }
  } catch (error) {
    console.log("Error sharing to WhatsApp:", error);
  }
};

export const shareToInstagram = async (businessName: string, businessId: string) => {
  const deepLink = generateBusinessDeepLink(businessId);
  const message = `Discover ${businessName} on 2Where?! \n${deepLink}`;
  
  try {
    await Share.shareSingle({
      title: '2Where?',
      message: message,
      social: Share.Social.INSTAGRAM as any,
      url: deepLink,
    });
  } catch (error) {
    console.log("Error sharing to Instagram OR App not installed, falling back to Native Dialog");
    // Fallback to Native Sheet
    try {
      await Share.open({ message, url: deepLink });
    } catch (e) {
      console.log("User cancelled share", e);
    }
  }
};

export const nativeShare = async (businessName: string, businessId: string) => {
  const deepLink = generateBusinessDeepLink(businessId);
  try {
    await Share.open({
      title: `Check out ${businessName}`,
      message: `See ${businessName} on 2Where?! 👑\n${deepLink}`
    });
  } catch (error) {
    console.log("User cancelled share", error);
  }
};
