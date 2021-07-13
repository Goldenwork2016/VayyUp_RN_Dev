import {StyleSheet} from 'react-native';

export const AppStyles = {
  color: {
    background: '#eee',
    primaryBackground: '#fff',
    secondary: '#e8505b',
    primary: '#193C4F',
    errorText: '#ff5a66',
    main: '#5ea23a',
    text: '#000',
    title: '#464646',
    subtitle: '#545454',
    categoryTitle: '#161616',
    //tint: '#ff5a66',
    tint: '#193C4F',
    description: '#bbbbbb',
    filterTitle: '#8a8a8a',
    starRating: '#2bdf85',
    location: '#a9a9a9',
    white: 'white',
    facebook: 'rgb(54, 88, 153)',
    grey: 'grey',
    greenBlue: '#00aea8',
    placeholder: '#a0a0a0',
    // background: '#f2f2f2',
    blue: '#3293fe',
    bgColor:'#0C0B54',
    btnColor:'#EB4F58',
    grayText:'#E5E5E5',
    TextInPutBgColor:'#EBEDEF'
  },
  fontSize: {
    title: 30,
    content: 20,
    normal: 16,
  },
  buttonWidth: {
    main: '70%',
  },
  textInputWidth: {
    main: '80%',
  },
  fontName: {
    main: 'Noto Sans',
    bold: 'Noto Sans',
    poppins:'Poppins-Regular',
    poppinsBold:'Poppins-Bold',
    poppinsSemiBold:'Poppins-SemiBold'
  },
  borderRadius: {
    main: 8,
    small: 3,
  },
};

export const AppIcon = {
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    marginRight: 10,
  },
  style: {
    tintColor: AppStyles.color.tint,
    width: 25,
    height: 25,
  },
  images: {
    logo: require('../assets/logo.png'),
    logo2: require('../assets/logo-2.png'),
    logo3: require('../assets/logo-3.png'),
    home: require('../assets/icons/home.png'),
    defaultUser: require('../assets/icons/default_user.jpg'),
    logout: require('../assets/icons/shutdown.png'),
  },
};

export const HeaderButtonStyle = StyleSheet.create({
  multi: {
    flexDirection: 'row',
  },
  container: {
    padding: 10,
  },
  image: {
    justifyContent: 'center',
    width: 35,
    height: 35,
    margin: 6,
  },
  rightButton: {
    color: AppStyles.color.tint,
    marginRight: 10,
    fontWeight: 'normal',
    fontFamily: AppStyles.fontName.main,
  },
});

export const ListStyle = StyleSheet.create({
  title: {
    fontSize: 16,
    color: AppStyles.color.subtitle,
    fontFamily: AppStyles.fontName.bold,
    fontWeight: 'bold',
  },
  subtitleView: {
    minHeight: 55,
    flexDirection: 'row',
    paddingTop: 5,
    marginLeft: 10,
  },
  leftSubtitle: {
    flex: 2,
  },
  avatarStyle: {
    height: 80,
    width: 80,
  },
});
