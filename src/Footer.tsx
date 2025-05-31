import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Footer = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.footer}>
      <Text style={styles.text}>ServEaso</Text>
      <View style={styles.socialMedia}>
        <TouchableOpacity onPress={() => openLink('https://www.twitter.com')}>
          <Ionicons name="logo-twitter" size={24} color="#075aa8" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://www.instagram.com')}>
          <Ionicons name="logo-instagram" size={24} color="#075aa8" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://www.youtube.com')}>
          <Ionicons name="logo-youtube" size={24} color="#075aa8" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://www.linkedin.com')}>
          <Ionicons name="logo-linkedin" size={24} color="#075aa8" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852#')}>
          <Ionicons name="logo-facebook" size={24} color="#075aa8" style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    backgroundColor: 'rgb(200, 228, 255)',
    paddingVertical: 20,
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: '#075aa8',
    paddingTop: 10,
  },
  socialMedia: {
    flexDirection: 'row',
    marginTop: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
});

export default Footer;
