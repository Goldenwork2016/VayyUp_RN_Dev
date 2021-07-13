import React, {useState} from 'react';
import {View} from 'react-native';
import dynamicStyles from './styles';
import VUTabItem from './VUTabItem';

const photoModalTab = {
  name: 'Photo',
  key: 'Photo-6UB4BaeaA8m662ywhstar',
};

export default function BottomTabs(props) {
  const {state, navigation, tabBarIcon, colorTitle} = props;
  const styles = dynamicStyles();

  const [isTransparentTab, setIsTransparentTab] = useState(true);

  const customRoutes = [...state.routes];
  const indexToInsert = Math.floor(customRoutes.length / 2);
  customRoutes.splice(indexToInsert, 0, photoModalTab);

  const onAddPress = () => {
    navigation.navigate('Record');
  };

  const onTabItemPress = (routeName) => {
    // if (
    //   routeName?.toLowerCase() === 'home' ||
    //   routeName?.toLowerCase() === 'myvideos'
    // ) {
    //   setIsTransparentTab(true);
    // } else {
    //   setIsTransparentTab(false);
    // }
    setIsTransparentTab(true);
    navigation.navigate(routeName);
  };

  const getIsFocus = (stateIndex, currentTabIndex) => {
    if (stateIndex >= indexToInsert) {
      const adjustedStateIndex = stateIndex + 1;
      return adjustedStateIndex === currentTabIndex;
    }
    return state.index === currentTabIndex;
  };

  const renderTabItem = (route, index) => {
    return (
      <VUTabItem
        key={index + ''}
        tabIcons={tabBarIcon}
        focus={getIsFocus(state.index, index)}
        routeName={route.name}
        onPress={onTabItemPress}
        isAddPhoto={route.name?.toLowerCase() === 'photo'}
        colorTitle={colorTitle}
        isTransparentTab={isTransparentTab}
        onAddPress={onAddPress}
      />
    );
  };

  return (
    <View
      style={[
        styles.tabContainer,
        isTransparentTab
          ? {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          : {backgroundColor: '#f5f5f5'},
      ]}>
      {customRoutes.map(renderTabItem)}
    </View>
  );
}
