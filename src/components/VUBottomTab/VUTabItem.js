import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import dynamicStyles from './styles';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {AntDesignIcon,EntypoIcon} from 'src/icons';

import Trophy from 'common-components/icons/Trophy';
import User from 'common-components/icons/User';
import Video from 'common-components/icons/Video';

import {VUText} from 'common-components';

const color = {
  normal: '#C4C4C4',
  focused: '#EB4F58',
};

const routes = {
  Home: {
    icon: <FontAwesome name="home" size={16} color={color.normal} />,
    focusIcon: <FontAwesome name="home" size={16} color={color.focused} />,
    label: 'Home',
  },
  Competition: {
    icon: <Trophy size={16} color={color.normal} />,
    focusIcon: <Trophy size={16} color={color.focused} />,
    label: 'Competition',
  },
  MyVideos: {
    icon: <Video size={16} color={color.normal} />,
    focusIcon: <Video size={16} color={color.focused} />,
    label: 'My Videos',
  },
  Profile: {
    icon: <User size={16} color={color.normal} />,
    focusIcon: <User size={16} color={color.focused} />,
    label: 'Profile',
  },
  Photo: {
    icon: <EntypoIcon size={32} name="plus" color="#fff" />,
    label: 'Photo',
  },
};

function VUTabItem({
  onPress,
  focus,
  routeName,
  isAddPhoto,
  isTransparentTab,
  onAddPress,
}) {
  const styles = dynamicStyles();
  const {icon, focusIcon, label} = routes[routeName] || {};
  const onTabPress = () => {
    onPress(routeName);
  };

  if (isAddPhoto) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onAddPress} style={[styles.addContainer]}>
          {icon}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onTabPress}>
      {focus ? focusIcon : icon}
      <VUText fontSize={10} color={focus ? color.focused : color.normal}>
        {label}
      </VUText>
    </TouchableOpacity>
  );
}

export default VUTabItem;
